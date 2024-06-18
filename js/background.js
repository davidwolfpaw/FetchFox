// Listener for messages sent from popup.js
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "saveMetadata") {
        // Query the active tab in the current window
        const querying = browser.tabs.query({ active: true, currentWindow: true });
        querying.then(tabs => {
            const currentTab = tabs[0];
            const codeToInject = `(${extractMetadata.toString()})();`;

            // Inject the content script to extract metadata from the active tab
            browser.tabs.executeScript(currentTab.id, { code: codeToInject }).then(results => {
                const metadata = results[0];
                metadata.linkType = defaultLinkType(metadata);

                // Save the extracted metadata to the extension's local storage
                browser.storage.local.get("allMetadata").then(data => {
                    let allMetadata = data.allMetadata || [];
                    allMetadata.push(metadata);
                    browser.storage.local.set({ allMetadata: allMetadata }).then(() => {
                        sendResponse({ success: true, message: "Metadata saved successfully" });
                    }).catch(error => {
                        console.error("Error saving metadata to extension's storage:", error);
                        sendResponse({ success: false, message: "Error saving metadata" });
                    });
                }).catch(error => {
                    console.error("Error getting existing metadata from extension's storage:", error);
                    sendResponse({ success: false, message: "Error retrieving metadata" });
                });
            }).catch(error => {
                console.error("Error executing content script:", error);
                sendResponse({ success: false, message: "Error executing script" });
            });
        }).catch(error => {
            console.error("Error querying active tab:", error);
            sendResponse({ success: false, message: "Error querying active tab" });
        });

        return true; // Indicate that the response is sent asynchronously
    }
});

// Determine default link type based on metadata
function defaultLinkType(metadata) {
    const url = metadata.url.toLowerCase();
    const type = metadata.type.toLowerCase();

    if (type.includes('audio')) return 'audio';
    if (type.includes('video')) return 'video';
    if (url.includes('youtube.com')) return 'video';
    if (url.includes('play.pocketcasts.com') || url.includes('open.spotify.com')) return 'audio';

    return 'article';
}

// Extract metadata from the current page
function extractMetadata() {
    // Helper function to find content using a list of selectors
    const findContentBySelectors = (selectors, defaultValue = '') => {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && (element.content || element.getAttribute('content') || element.textContent)) {
                return sanitizeString(element.content || element.getAttribute('content') || element.textContent);
            }
        }
        return defaultValue;
    };

    // Object defining the metadata rules with selectors
    const metadataRules = {
        title: () => findContentBySelectors([
            'meta[property="og:title"]', 'meta[name="og:title"]',
            'meta[property="twitter:title"]', 'meta[name="twitter:title"]',
            'meta[property="parsely-title"]', 'meta[name="parsely-title"]',
            'title', 'h1'
        ], 'No title'),

        description: () => findContentBySelectors([
            'meta[property="og:description"]', 'meta[name="og:description"]',
            'meta[property="description" i]', 'meta[name="description" i]',
            'meta[property="twitter:description"]', 'meta[name="twitter:description"]',
            'meta[property="summary" i]', 'meta[name="summary" i]'
        ], 'No description'),

        url: () => findContentBySelectors([
            'link[rel="canonical"]', 'meta[property="og:url"]', 'meta[name="og:url"]',
            'meta[property="al:web:url"]', 'meta[name="al:web:url"]',
            'meta[property="parsely-link"]', 'meta[name="parsely-link"]'
        ], window.location.href),

        author: () => findContentBySelectors([
            'meta[property="article:author"]', 'meta[name="article:author"]',
            'meta[property="parsely-author"]', 'meta[name="parsely-author"]',
            'a[class*="author" i]', '[rel="author"]',
            'meta[name="author"]', 'meta[property="book:author"]',
            'meta[property="twitter:creator"]', 'meta[name="twitter:creator"]',
            'meta[property="profile:username"]', 'meta[name="profile:username"]',
            '[itemprop="author"]', '.wp-block-post-author__name'
        ], 'No author'),

        language: () => findContentBySelectors([
            'meta[property="language" i]', 'meta[name="language" i]',
            'meta[property="og:locale"]', 'meta[name="og:locale"]'
        ], document.documentElement.lang),

        type: () => findContentBySelectors([
            'meta[property="og:type"]', 'meta[name="og:type"]',
            'meta[property="parsely-type"]', 'meta[name="parsely-type"]',
            'meta[property="medium"]', 'meta[name="medium"]'
        ], 'No type specified'),

        provider: () => findContentBySelectors([
            'meta[property="og:site_name"]', 'meta[name="og:site_name"]',
            'meta[property="publisher" i]', 'meta[name="publisher" i]',
            'meta[property="application-name" i]', 'meta[name="application-name" i]',
            'meta[property="al:android:app_name"]', 'meta[name="al:android:app_name"]',
            'meta[property="al:iphone:app_name"]', 'meta[name="al:iphone:app_name"]',
            'meta[property="al:ios:app_name"]', 'meta[name="al:ios:app_name"]',
            'meta[property="twitter:app:name:iphone"]', 'meta[name="twitter:app:name:iphone"]',
            'meta[property="twitter:app:name:ipad"]', 'meta[name="twitter:app:name:ipad"]',
            'meta[property="twitter:app:name:googleplay"]', 'meta[name="twitter:app:name:googleplay"]'
        ], 'No provider specified'),

        keywords: () => findContentBySelectors([
            'meta[property="keywords" i]', 'meta[name="keywords" i]',
            'meta[property="parsely-tags"]', 'meta[name="parsely-tags"]',
            'meta[property="article:tag" i]', 'meta[name="article:tag" i]',
            'meta[property="book:tag" i]', 'meta[name="book:tag" i]',
            'meta[property="topic" i]', 'meta[name="topic" i]'
        ], 'No keywords'),

        section: () => findContentBySelectors([
            'meta[property="article:section"]', 'meta[name="article:section"]',
            'meta[property="category"]', 'meta[name="category"]'
        ], 'No section'),

        published: () => findContentBySelectors([
            'meta[property="article:published_time"]', 'meta[name="article:published_time"]',
            'meta[property="published_time"]', 'meta[name="published_time"]',
            'meta[property="parsely-pub-date"]', 'meta[name="parsely-pub-date"]',
            'meta[property="date" i]', 'meta[name="date" i]',
            'meta[property="release_date" i]', 'meta[name="release_date" i]'
        ], 'No publish date'),

        modified: () => findContentBySelectors([
            'meta[property="og:updated_time"]', 'meta[name="og:updated_time"]',
            'meta[property="article:modified_time"]', 'meta[name="article:modified_time"]',
            'meta[property="updated_time" i]', 'meta[name="updated_time" i]',
            'meta[property="modified_time"]', 'meta[name="modified_time"]',
            'meta[property="revised"]', 'meta[name="revised"]'
        ], 'No modified date'),

        copyright: () => findContentBySelectors([
            'meta[property="copyright" i]', 'meta[name="copyright" i]'
        ], 'No copyright information'),

        image: () => findContentBySelectors([
            'meta[property="og:image:secure_url"]', 'meta[name="og:image:secure_url"]',
            'meta[property="og:image:url"]', 'meta[name="og:image:url"]',
            'meta[property="og:image"]', 'meta[name="og:image"]',
            'meta[property="twitter:image"]', 'meta[name="twitter:image"]',
            'link[rel="image_src"]'
        ], 'No image'),

        video: () => findContentBySelectors([
            'meta[property="og:video:secure_url"]', 'meta[name="og:video:secure_url"]',
            'meta[property="og:video:url"]', 'meta[name="og:video:url"]',
            'meta[property="og:video"]', 'meta[name="og:video"]'
        ], 'No video'),

        audio: () => findContentBySelectors([
            'meta[property="og:audio:secure_url"]', 'meta[name="og:audio:secure_url"]',
            'meta[property="og:audio:url"]', 'meta[name="og:audio:url"]',
            'meta[property="og:audio"]', 'meta[name="og:audio"]'
        ], 'No audio')
    };


    // Remove line breaks from a string
    function sanitizeString(str) {
        return str.replace(/(\r\n|\n|\r)/gm, ' ');
    }

    // Extract metadata based on the defined rules
    let metadata = {};
    for (const key in metadataRules) {
        if (Object.prototype.hasOwnProperty.call(metadataRules, key)) {
            try {
                const value = metadataRules[key]();
                if (value) {
                    metadata[key] = value;
                }
            } catch (e) {
                console.error(`Error extracting metadata for key ${key}:`, e);
            }
        }
    }
    return metadata;
}
