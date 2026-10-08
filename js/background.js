// Listener for messages sent from popup.js
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "saveMetadata") {
        // Query the active tab in the current window
        const querying = browser.tabs.query({ active: true, currentWindow: true });
        querying.then(tabs => {
            const currentTab = tabs[0];
            const codeToInject = `(${extractMetadata.toString()})();`;
            console.log(codeToInject);

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


    // Several media sites are single page apps: after an in-page navigation
    // their meta tags, JSON-LD and microdata can still describe the previously
    // viewed item. For those sites the affected fields are read from the live
    // DOM and the address bar instead.
    const siteOverrides = (() => {
        let address;
        try {
            address = new URL(window.location.href);
        } catch (e) {
            return null;
        }
        const host = address.hostname;
        const path = address.pathname;
        const isHost = (domain) => host === domain || host.endsWith('.' + domain);

        // Read the first non-empty text the app has rendered
        const liveText = (selectors) => {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                const text = element && (element.textContent || '').trim();
                if (text) return sanitizeString(text);
            }
            return '';
        };

        // Read an attribute from a node the app re-renders per item
        const liveAttr = (selector, attribute) => {
            const element = document.querySelector(selector);
            if (!element) return '';
            return sanitizeString(element.getAttribute(attribute) || '');
        };

        // document.title tracks in-page navigation on every SPA router
        const docTitle = (suffix) => sanitizeString((document.title || '').replace(suffix, '').trim());

        if (isHost('youtube.com')) {
            let videoId = null;
            if (path === '/watch') {
                videoId = address.searchParams.get('v');
            } else if (path.startsWith('/shorts/')) {
                videoId = path.split('/')[2] || null;
            }
            if (!videoId) return null;
            return {
                url: () => 'https://www.youtube.com/watch?v=' + videoId,
                title: () => liveText([
                    'ytd-watch-metadata #title h1 yt-formatted-string',
                    'ytd-watch-metadata #title h1',
                    'h1.ytd-watch-metadata',
                    '#above-the-fold #title',
                    'ytd-reel-player-header-renderer h2'
                ]) || docTitle(/\s*-\s*YouTube$/),
                author: () => liveText([
                    'ytd-watch-metadata ytd-channel-name a',
                    '#owner ytd-channel-name a',
                    '#upload-info ytd-channel-name a',
                    'ytd-reel-player-header-renderer ytd-channel-name a'
                ]),
                description: () => liveText([
                    '#description-inline-expander yt-attributed-string',
                    '#description-inline-expander'
                ]),
                published: () => liveAttr('ytd-player-microformat-renderer meta[itemprop="uploadDate"]', 'content'),
                image: () => 'https://i.ytimg.com/vi/' + videoId + '/maxresdefault.jpg',
                video: () => 'https://www.youtube.com/embed/' + videoId
            };
        }

        if (isHost('open.spotify.com')) {
            const route = path.match(/^\/(?:intl-[a-z-]+\/)?(track|episode|show|album|playlist|artist|audiobook)\/([A-Za-z0-9]+)/);
            if (!route) return null;
            const kind = route[1];
            const id = route[2];
            const isAudio = kind === 'track' || kind === 'album' || kind === 'episode';
            return {
                // Drop the ?si= share token, which also goes stale
                url: () => 'https://open.spotify.com/' + kind + '/' + id,
                title: () => liveText([
                    '[data-testid="entityTitle"] h1',
                    '[data-testid="episode-title"]',
                    'main h1'
                ]) || docTitle(/\s*[|–-]\s*Spotify\s*$/),
                author: () => liveText([
                    '[data-testid="creator-link"]',
                    '[data-testid="entity-subtitle"] a',
                    'main a[href^="/show/"]',
                    'main a[href^="/artist/"]'
                ]),
                description: () => liveText([
                    '[data-testid="episode-description"]',
                    '[data-testid="entity-description"]'
                ]),
                image: () => liveAttr('[data-testid="entity-header-image"] img, main img[src*="scdn.co"]', 'src'),
                video: () => '',
                audio: () => (isAudio ? 'https://open.spotify.com/' + kind + '/' + id : '')
            };
        }

        if (isHost('podcasts.apple.com') || isHost('music.apple.com')) {
            // The episode or track lives in the ?i= parameter, so it is kept
            const itemId = address.searchParams.get('i');
            return {
                url: () => address.origin + path + (itemId ? '?i=' + itemId : ''),
                title: () => liveText([
                    '[data-testid="non-editable-product-title"]',
                    '.headings__title',
                    '.product-header__title',
                    'main h1'
                ]) || docTitle(/\s*[|–-]\s*Apple (Podcasts|Music)\s*$/),
                author: () => liveText([
                    '[data-testid="product-creator"] a',
                    '.headings__subtitles',
                    '.product-header__identity a',
                    'main a[href*="/podcast/"]',
                    'main a[href*="/artist/"]'
                ]),
                description: () => liveText([
                    '[data-testid="episode-description"]',
                    '.product-hero-desc',
                    '.section__description'
                ]),
                image: () => liveAttr('main picture img, .artwork img, main img[src*="mzstatic.com"]', 'src'),
                video: () => ''
            };
        }

        if (isHost('pocketcasts.com')) {
            return {
                title: () => liveText([
                    '.episode-title',
                    '.podcast_title',
                    'main h1'
                ]),
                author: () => liveText([
                    'div[class="desc"]',
                    '.podcast-title',
                    '.author'
                ]),
                description: () => liveText([
                    '.episode-show-notes',
                    '.show-notes'
                ]),
                video: () => ''
            };
        }

        return null;
    })();

    // Use the site specific reader whenever the site has one, even when it
    // comes back empty, so that a stale meta tag can never win on these sites
    const overrideOr = (field, fallback) => {
        if (!siteOverrides || !siteOverrides[field]) return null;
        return siteOverrides[field]() || fallback;
    };

    // True when two titles share a word of four or more characters. Used to
    // spot stale meta tags on single page apps that are not listed above.
    const sharesWord = (first, second) => {
        const words = (text) => new Set(String(text).toLowerCase().match(/[a-z0-9]{4,}/g) || []);
        const firstWords = words(first);
        const secondWords = words(second);
        if (!firstWords.size || !secondWords.size) return true;
        for (const word of secondWords) {
            if (firstWords.has(word)) return true;
        }
        return false;
    };

    // Helper function to parse JSON-LD data
    const parseJsonLd = () => {
        const scriptElements = document.querySelectorAll('script[type="application/ld+json"]');
        for (const scriptElement of scriptElements) {
            try {
                const jsonData = JSON.parse(scriptElement.textContent);
                if (jsonData['@type'] === 'CreativeWorkSeries' || jsonData['@type'] === 'PodcastEpisode') {
                    return jsonData;
                }
            } catch (e) {
                console.error('Error parsing JSON-LD:', e);
            }
        }
        return null;
    };

    // Object defining the metadata rules with JSON-LD data, followed by selectors
    const metadataRules = {
        title: () => {
            const override = overrideOr('title', 'No title');
            if (override) return override;
            const jsonLd = parseJsonLd();
            if (jsonLd && jsonLd.name) {
                return sanitizeString(jsonLd.name);
            }
            const metaTitle = findContentBySelectors([
                'meta[property="og:title"]', 'meta[name="og:title"]',
                'meta[property="twitter:title"]', 'meta[name="twitter:title"]',
                'meta[property="parsely-title"]', 'meta[name="parsely-title"]',
                'meta[name="apple:title"]',
                'title', 'h1'
            ], 'No title');
            // Last resort check for an unlisted single page app: document.title
            // follows in-page navigation, so a meta title with nothing in common
            // with it is most likely left over from an earlier page
            const liveTitle = sanitizeString((document.title || '').trim());
            if (liveTitle && metaTitle !== 'No title' && !sharesWord(metaTitle, liveTitle)) {
                return liveTitle;
            }
            return metaTitle;
        },

        description: () => {
            const override = overrideOr('description', 'No description');
            if (override) return override;
            const jsonLd = parseJsonLd();
            if (jsonLd && jsonLd.description) {
                return sanitizeString(jsonLd.description);
            }
            return findContentBySelectors([
                'meta[property="og:description"]', 'meta[name="og:description"]',
                'meta[property="description" i]', 'meta[name="description" i]',
                'meta[property="twitter:description"]', 'meta[name="twitter:description"]',
                'meta[property="summary" i]', 'meta[name="summary" i]'
            ], 'No description');
        },

        url: () => {
            const override = overrideOr('url', window.location.href);
            if (override) return override;
            const jsonLd = parseJsonLd();
            if (jsonLd && jsonLd.url) {
                return sanitizeString(jsonLd.url);
            }
            const hostname = window.location.hostname;
            if (hostname.includes('pocketcasts.com')) {
                const episodeURL = document.querySelector('input[placeholder="Getting link..."]');
                if (episodeURL) {
                    return sanitizeString(episodeURL.value);
                }
            }
            return findContentBySelectors([
                'link[rel="canonical"]', 'meta[property="og:url"]', 'meta[name="og:url"]',
                'meta[property="al:web:url"]', 'meta[name="al:web:url"]',
                'meta[property="parsely-link"]', 'meta[name="parsely-link"]'
            ], window.location.href);
        },

        author: () => {
            const override = overrideOr('author', 'No author');
            if (override) return override;
            const jsonLd = parseJsonLd();
            const hostname = window.location.hostname;
            if (jsonLd && jsonLd.author && jsonLd.author.name) {
                return sanitizeString(jsonLd.author.name);
            }
            if (hostname.includes('podcasts.apple.com')) {
                if (jsonLd && jsonLd.partOfSeries && jsonLd.partOfSeries.name) {
                    return sanitizeString(jsonLd.partOfSeries.name);
                }
            }
            if (hostname.includes('pocketcasts.com')) {
                const podcastAuthor = document.querySelector('div[class="desc"]');
                if (podcastAuthor) {
                    return sanitizeString(podcastAuthor.textContent);
                }
            }
            return findContentBySelectors([
                'meta[property="article:author"]', 'meta[name="article:author"]',
                'meta[property="parsely-author"]', 'meta[name="parsely-author"]',
                'a[class*="author" i]', '[rel="author"]', 'meta[property="og:author"]',
                'meta[name="author"]', 'meta[property="book:author"]',
                'meta[property="twitter:creator"]', 'meta[name="twitter:creator"]',
                'meta[property="profile:username"]', 'meta[name="profile:username"]',
                '[itemprop="author"]', '.wp-block-post-author__name',
                'a[href^="/artist/"] span', 'a[class*="podcast-title"]',
                'meta[itemprop="author"]', 'link[itemprop="name"]', 'ytd-channel-name a'
            ], 'No author');
        },

        type: () => {
            const jsonLd = parseJsonLd();
            if (jsonLd && jsonLd['@type']) {
                return sanitizeString(jsonLd['@type']);
            }
            return findContentBySelectors([
                'meta[property="og:type"]', 'meta[name="og:type"]',
                'meta[property="parsely-type"]', 'meta[name="parsely-type"]',
                'meta[property="medium"]', 'meta[name="medium"]'
            ], 'No type specified');
        },

        language: () => {
            const jsonLd = parseJsonLd();
            if (jsonLd && jsonLd.inLanguage) {
                return sanitizeString(jsonLd.inLanguage);
            }
            return findContentBySelectors([
                'meta[property="language" i]', 'meta[name="language" i]',
                'meta[property="og:locale"]', 'meta[name="og:locale"]'
            ], document.documentElement.lang);
        },

        provider: () => {
            const jsonLd = parseJsonLd();
            if (jsonLd && jsonLd.publisher && jsonLd.publisher.name) {
                return sanitizeString(jsonLd.publisher.name);
            }
            return findContentBySelectors([
                'meta[property="og:site_name"]', 'meta[name="og:site_name"]',
                'meta[property="publisher" i]', 'meta[name="publisher" i]',
                'meta[property="application-name" i]', 'meta[name="application-name" i]',
                'meta[property="al:android:app_name"]', 'meta[name="al:android:app_name"]',
                'meta[property="al:iphone:app_name"]', 'meta[name="al:iphone:app_name"]',
                'meta[property="al:ios:app_name"]', 'meta[name="al:ios:app_name"]',
                'meta[property="twitter:app:name:iphone"]', 'meta[name="twitter:app:name:iphone"]',
                'meta[property="twitter:app:name:ipad"]', 'meta[name="twitter:app:name:ipad"]',
                'meta[property="twitter:app:name:googleplay"]', 'meta[name="twitter:app:name:googleplay"]'
            ], 'No provider specified');
        },

        keywords: () => {
            const jsonLd = parseJsonLd();
            if (jsonLd && jsonLd.keywords) {
                return sanitizeString(jsonLd.keywords);
            }
            return findContentBySelectors([
                'meta[property="keywords" i]', 'meta[name="keywords" i]',
                'meta[property="parsely-tags"]', 'meta[name="parsely-tags"]',
                'meta[property="article:tag" i]', 'meta[name="article:tag" i]',
                'meta[property="book:tag" i]', 'meta[name="book:tag" i]',
                'meta[property="topic" i]', 'meta[name="topic" i]'
            ], 'No keywords');
        },

        section: () => {
            const jsonLd = parseJsonLd();
            if (jsonLd && jsonLd.genre) {
                return sanitizeString(jsonLd.genre);
            }
            return findContentBySelectors([
                'meta[property="article:section"]', 'meta[name="article:section"]',
                'meta[property="category"]', 'meta[name="category"]'
            ], 'No section');
        },

        published: () => {
            const override = overrideOr('published', 'No publish date');
            if (override) return override;
            const jsonLd = parseJsonLd();
            if (jsonLd && jsonLd.uploadDate) {
                return sanitizeString(jsonLd.uploadDate);
            }
            return findContentBySelectors([
                'meta[property="article:published_time"]', 'meta[name="article:published_time"]',
                'meta[property="published_time"]', 'meta[name="published_time"]',
                'meta[property="parsely-pub-date"]', 'meta[name="parsely-pub-date"]',
                'meta[property="date" i]', 'meta[name="date" i]',
                'meta[property="release_date" i]', 'meta[name="release_date" i]',
                'meta[itemprop="datePublished"]'
            ], 'No publish date');
        },

        modified: () => {
            const jsonLd = parseJsonLd();
            if (jsonLd && jsonLd.dateModified) {
                return sanitizeString(jsonLd.dateModified);
            }
            return findContentBySelectors([
                'meta[property="og:updated_time"]', 'meta[name="og:updated_time"]',
                'meta[property="article:modified_time"]', 'meta[name="article:modified_time"]',
                'meta[property="updated_time" i]', 'meta[name="updated_time" i]',
                'meta[property="modified_time"]', 'meta[name="modified_time"]',
                'meta[property="revised"]', 'meta[name="revised"]',
                'meta[itemprop="dateModified"]'
            ], 'No modified date');
        },

        copyright: () => findContentBySelectors([
            'meta[property="copyright" i]', 'meta[name="copyright" i]'
        ], 'No copyright information'),

        copyright: () => {
            const jsonLd = parseJsonLd();
            if (jsonLd && jsonLd.copyrightHolder && jsonLd.copyrightHolder.name) {
                return sanitizeString(jsonLd.copyrightHolder.name);
            }
            return findContentBySelectors([
                'meta[property="copyright" i]', 'meta[name="copyright" i]'
            ], 'No copyright information');
        },

        image: () => {
            const override = overrideOr('image', 'No image');
            if (override) return override;
            const jsonLd = parseJsonLd();
            if (jsonLd && jsonLd.thumbnailUrl) {
                return Array.isArray(jsonLd.thumbnailUrl) ? jsonLd.thumbnailUrl[0] : sanitizeString(jsonLd.thumbnailUrl);
            }
            return findContentBySelectors([
                'meta[property="og:image:secure_url"]', 'meta[name="og:image:secure_url"]',
                'meta[property="og:image:url"]', 'meta[name="og:image:url"]',
                'meta[property="og:image"]', 'meta[name="og:image"]',
                'meta[property="twitter:image"]', 'meta[name="twitter:image"]',
                'link[rel="image_src"]'
            ], 'No image');
        },

        video: () => {
            const override = overrideOr('video', 'No video');
            if (override) return override;
            const jsonLd = parseJsonLd();
            if (jsonLd && jsonLd.embedUrl) {
                return sanitizeString(jsonLd.embedUrl);
            }
            return findContentBySelectors([
                'meta[property="og:video:secure_url"]', 'meta[name="og:video:secure_url"]',
                'meta[property="og:video:url"]', 'meta[name="og:video:url"]',
                'meta[property="og:video"]', 'meta[name="og:video"]'
            ], 'No video');
        },

        audio: () => {
            const override = overrideOr('audio', 'No audio');
            if (override) return override;
            const jsonLd = parseJsonLd();
            if (jsonLd && jsonLd.audio) {
                return sanitizeString(jsonLd.audio);
            }
            return findContentBySelectors([
                'meta[property="og:audio:secure_url"]', 'meta[name="og:audio:secure_url"]',
                'meta[property="og:audio:url"]', 'meta[name="og:audio:url"]',
                'meta[property="og:audio"]', 'meta[name="og:audio"]'
            ], 'No audio');
        }
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
