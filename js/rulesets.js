// metadataRules object defines the property names and potential values
//
const metadataRules = {
    title: () => {
        return (
            document.querySelector('meta[property="og:title"]')?.content ||
            document.querySelector('meta[name="og:title"]')?.content ||
            document.querySelector('meta[property="twitter:title"]')?.content ||
            document.querySelector('meta[name="twitter:title"]')?.content ||
            document.querySelector('meta[property="parsely-title"]')?.content ||
            document.querySelector('meta[name="parsely-title"]')?.content ||
            document.title ||
            document.querySelector('h1').textContent
        );
    },
    description: () => {
        return (
            document.querySelector('meta[property="og:description"]')?.content ||
            document.querySelector('meta[name="og:description"]')?.content ||
            document.querySelector('meta[property="description" i]')?.content ||
            document.querySelector('meta[name="description" i]')?.content ||
            document.querySelector('meta[property="twitter:description"]')?.content ||
            document.querySelector('meta[name="twitter:description"]')?.content ||
            document.querySelector('meta[property="summary" i]')?.content ||
            document.querySelector('meta[name="summary" i]')?.content
        );
    },
    url: () => {
        return (
            document.querySelector('link[rel="canonical"]')?.href ||
            document.querySelector('meta[property="og:url"]')?.content ||
            document.querySelector('meta[name="og:url"]')?.content ||
            document.querySelector('meta[property="al:web:url"]')?.content ||
            document.querySelector('meta[name="al:web:url"]')?.content ||
            document.querySelector('meta[property="parsely-link"]')?.content ||
            document.querySelector('meta[name="parsely-link"]')?.content ||
            window.location.href
        );
    },
    author: () => {
        return (
            document.querySelector('meta[name="author"]')?.content ||
            document.querySelector('meta[property="book:author"]')?.content ||
            document.querySelector('.author')?.textContent
        );
    },
    image: () => {
        return (
            document.querySelector('meta[property="og:image"]')?.content ||
            document.querySelector('meta[name="twitter:image"]')?.content ||
            document.querySelector('link[rel="image_src"]')?.href
        );
    },
    language: () => {
        return (
            document.querySelector('html[lang]')?.getAttribute('lang') ||
            document.querySelector('meta[property="language" i]')?.content ||
            document.querySelector('meta[name="language" i]')?.content ||
            document.querySelector('meta[property="og:locale"]')?.content ||
            document.querySelector('meta[name="og:locale"]')?.content
        )
    },
    type: () => {
        return (
            document.querySelector('meta[property="og:type"]')?.content ||
            document.querySelector('meta[name="og:type"]')?.content ||
            document.querySelector('meta[property="parsely-type"]')?.content ||
            document.querySelector('meta[name="parsely-type"]')?.content ||
            document.querySelector('meta[property="medium"]')?.content ||
            document.querySelector('meta[name="medium"]')?.content
        )
    },
    provider: () => {
        return (
            document.querySelector('meta[property="og:site_name"]')?.content ||
            document.querySelector('meta[name="og:site_name"]')?.content ||
            document.querySelector('meta[property="publisher" i]')?.content ||
            document.querySelector('meta[name="publisher" i]')?.content ||
            document.querySelector('meta[property="application-name" i]')?.content ||
            document.querySelector('meta[name="application-name" i]')?.content ||
            document.querySelector('meta[property="al:android:app_name"]')?.content ||
            document.querySelector('meta[name="al:android:app_name"]')?.content ||
            document.querySelector('meta[property="al:iphone:app_name"]')?.content ||
            document.querySelector('meta[name="al:iphone:app_name"]')?.content ||
            document.querySelector('meta[property="al:ipad:app_name"]')?.content ||
            document.querySelector('meta[name="al:ipad:app_name"]')?.content ||
            document.querySelector('meta[property="al:ios:app_name"]')?.content ||
            document.querySelector('meta[name="al:ios:app_name"]')?.content ||
            document.querySelector('meta[property="twitter:app:name:iphone"]')?.content ||
            document.querySelector('meta[name="twitter:app:name:iphone"]')?.content ||
            document.querySelector('meta[property="twitter:app:name:ipad"]')?.content ||
            document.querySelector('meta[name="twitter:app:name:ipad"]')?.content ||
            document.querySelector('meta[property="twitter:app:name:googleplay"]')?.content ||
            document.querySelector('meta[name="twitter:app:name:googleplay"]')?.content
        )
    },
    keywords: () => {
        return (
            document.querySelector('meta[property="keywords" i]')?.content ||
            document.querySelector('meta[name="keywords" i]')?.content ||
            document.querySelector('meta[property="parsely-tags"]')?.content ||
            document.querySelector('meta[name="parsely-tags"]')?.content ||
            document.querySelector('meta[property="article:tag" i]')?.content ||
            document.querySelector('meta[name="article:tag" i]')?.content ||
            document.querySelector('meta[property="book:tag" i]')?.content ||
            document.querySelector('meta[name="book:tag" i]')?.content ||
            document.querySelector('meta[property="topic" i]')?.content ||
            document.querySelector('meta[name="topic" i]')?.content
        )
        // TODO: split keywords into separate tags
    },
    section: () => {
        return (
            document.querySelector('meta[property="article:section"]')?.content ||
            document.querySelector('meta[name="article:section"]')?.content ||
            document.querySelector('meta[property="category"]')?.content ||
            document.querySelector('meta[name="category"]')?.content
        )
    },
    author: () => {
        return (
            document.querySelector('meta[property="author" i]')?.content ||
            document.querySelector('meta[name="author" i]')?.content ||
            document.querySelector('meta[property="article:author"]')?.content ||
            document.querySelector('meta[name="article:author"]')?.content ||
            document.querySelector('meta[property="book:author"]')?.content ||
            document.querySelector('meta[name="book:author"]')?.content ||
            document.querySelector('meta[property="parsely-author"]')?.content ||
            document.querySelector('meta[name="parsely-author"]')?.content ||
            document.querySelector('a[class*="author" i]')?.content ||
            document.querySelector('[rel="author"]')?.content ||
            document.querySelector('meta[property="twitter:creator"]')?.content ||
            document.querySelector('meta[name="twitter:creator"]')?.content ||
            document.querySelector('meta[property="profile:username"]')?.content ||
            document.querySelector('meta[name="profile:username"]')?.content
        )
    },
    published: () => {
        return (
            document.querySelector('meta[property="article:published_time"]')?.content ||
            document.querySelector('meta[name="article:published_time"]')?.content ||
            document.querySelector('meta[property="published_time"]')?.content ||
            document.querySelector('meta[name="published_time"]')?.content ||
            document.querySelector('meta[property="parsely-pub-date"]')?.content ||
            document.querySelector('meta[name="parsely-pub-date"]')?.content ||
            document.querySelector('meta[property="date" i]')?.content ||
            document.querySelector('meta[name="date" i]')?.content ||
            document.querySelector('meta[property="release_date" i]')?.content ||
            document.querySelector('meta[name="release_date" i]')?.content
        )
        // TODO: convert datetime with user setting
    },
    modified: () => {
        return (
            document.querySelector('meta[property="og:updated_time"]')?.content ||
            document.querySelector('meta[name="og:updated_time"]')?.content ||
            document.querySelector('meta[property="article:modified_time"]')?.content ||
            document.querySelector('meta[name="article:modified_time"]')?.content ||
            document.querySelector('meta[property="updated_time" i]')?.content ||
            document.querySelector('meta[name="updated_time" i]')?.content ||
            document.querySelector('meta[property="modified_time"]')?.content ||
            document.querySelector('meta[name="modified_time"]')?.content ||
            document.querySelector('meta[property="revised"]')?.content ||
            document.querySelector('meta[name="revised"]')?.content
        )
        // TODO: convert datetime with user setting
    },
    copyright: () => {
        return (
            document.querySelector('meta[property="copyright" i]')?.content ||
            document.querySelector('meta[name="copyright" i]')?.content
        )
    },
    image: () => {
        return (
            document.querySelector('meta[property="og:image:secure_url"]')?.content ||
            document.querySelector('meta[name="og:image:secure_url"]')?.content ||
            document.querySelector('meta[property="og:image:url"]')?.content ||
            document.querySelector('meta[name="og:image:url"]')?.content ||
            document.querySelector('meta[property="og:image"]')?.content ||
            document.querySelector('meta[name="og:image"]')?.content ||
            document.querySelector('meta[property="twitter:image"]')?.content ||
            document.querySelector('meta[name="twitter:image"]')?.content ||
            document.querySelector('meta[property="twitter:image:src"]')?.content ||
            document.querySelector('meta[name="twitter:image:src"]')?.content ||
            document.querySelector('meta[property="thumbnail"]')?.content ||
            document.querySelector('meta[name="thumbnail"]')?.content ||
            document.querySelector('meta[property="parsely-image-url"]')?.content ||
            document.querySelector('meta[name="parsely-image-url"]')?.content
        )
    },
    video: () => {
        return (
            document.querySelector('meta[property="og:video:secure_url"]')?.content ||
            document.querySelector('meta[name="og:video:secure_url"]')?.content ||
            document.querySelector('meta[property="og:video:url"]')?.content ||
            document.querySelector('meta[name="og:video:url"]')?.content ||
            document.querySelector('meta[property="og:video"]')?.content ||
            document.querySelector('meta[name="og:video"]')?.content
        )
    },
    audio: () => {
        return (
            document.querySelector('meta[property="og:audio:secure_url"]')?.content ||
            document.querySelector('meta[name="og:audio:secure_url"]')?.content ||
            document.querySelector('meta[property="og:audio:url"]')?.content ||
            document.querySelector('meta[name="og:audio:url"]')?.content ||
            document.querySelector('meta[property="og:audio"]')?.content ||
            document.querySelector('meta[name="og:audio"]')?.content
        )
    }
};

// Function to extract metadata using the rules
function extractMetadata() {
    let metadata = {};
    for (const property in metadataRules) {
        if (metadataRules.hasOwnProperty(property)) {
            metadata[property] = metadataRules[property]();
        }
    }
    return metadata;
}
