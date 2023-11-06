// Listen for messages sent from popup.js
browser.runtime.onMessage.addListener((message, sender) => {
    if (message.action === "saveMetadata") {
        return new Promise((resolve, reject) => {
            const querying = browser.tabs.query({ active: true, currentWindow: true });
            querying.then(tabs => {
                const currentTab = tabs[0];
                browser.tabs.executeScript(currentTab.id, { code: '(' + getPageMetadata.toString() + ')();' }).then(results => {
                    const metadata = results[0];

                    // Save to extension's storage and append to existing metadata
                    browser.storage.local.get("allMetadata").then(data => {
                        let allMetadata = data.allMetadata || [];
                        allMetadata.push(metadata);
                        browser.storage.local.set({ allMetadata: allMetadata }).then(() => {
                            resolve({ success: true, message: "Metadata saved successfully" });
                        }).catch(error => {
                            console.error("Error saving metadata to extension's storage:", error);
                            resolve({ success: false, message: "Error saving metadata" });
                        });
                    }).catch(error => {
                        console.error("Error getting existing metadata from extension's storage:", error);
                        resolve({ success: false, message: "Error retrieving metadata" });
                    });
                }).catch(error => {
                    console.error("Error executing content script:", error);
                    resolve({ success: false, message: "Error executing script" });
                });
            }).catch(error => {
                console.error("Error querying active tab:", error);
                resolve({ success: false, message: "Error querying active tab" });
            });
        });
    }
});

function getPageMetadata() {
    // This function is executed in the context of the webpage,
    // so it has access to the DOM
    const metadata = {};

    // Use querySelector to find meta tags and get their content
    metadata.title = document.querySelector('meta[property="og:title"]')?.content
        || document.title; // Fallback to the document title
    metadata.url = document.querySelector('meta[property="og:url"]')?.content
        || window.location.href;
    metadata.description = document.querySelector('meta[property="og:description"]')?.content
        || document.querySelector('meta[name="description"]')?.content;
    metadata.image = document.querySelector('meta[property="og:image"]')?.content;
    metadata.author = document.querySelector('meta[name="author"]')?.content;
    metadata.keywords = document.querySelector('meta[name="keywords"]')?.content;

    // Additional SEO related tags
    metadata.canonical = document.querySelector('link[rel="canonical"]')?.href;

    // In some cases, publish date might be available in meta tags
    metadata.publishDate = document.querySelector('meta[property="article:published_time"]')?.content
        || document.querySelector('meta[name="publish_date"]')?.content
        || document.querySelector('meta[name="date"]')?.content;

    return metadata;
}
