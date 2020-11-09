var CACHE_NAME = 'scorekeeper-cache-v1';
var urlsToCache = [
    '/Scorekeeper',
    '/Scorekeeper/index.html',
    '/Scorekeeper/styles.css',
    '/Scorekeeper/media-queries.css',
    '/Scorekeeper/index.js',
    '/Scorekeeper/apple-touch-icon.png',
    '/Scorekeeper/Header.svg',
    '/Scorekeeper/HeaderDark.svg',
    '/Scorekeeper/ShareIcon.svg',
    '/Scorekeeper/ShareIconDark.svg',
    '/Scorekeeper/CloseIcon.svg',
    '/Scorekeeper/CloseIconDark.svg',
    '/Scorekeeper/BugReportIcon.svg',
    '/Scorekeeper/BugReportIconDark.svg',
    '/Scorekeeper/PrintIcon.svg',
    '/Scorekeeper/PrintIconDark.svg',
    '/Scorekeeper/omnes-pro-light.otf',
    '/Scorekeeper/omnes-pro-regular.otf',
    '/Scorekeeper/omnes-pro-semibold.otf',
    
];

self.addEventListener('install', function (event) {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function (cache) {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
        .then(function (response) {
            // Cache hit - return response
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});
