var SERVICE_WORKER_VERSION = 1;
var CACHE_NAME = 'my-site-cache-v1';
var urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/index.js',
    '/apple-touch-icon.png',
    '/Header.svg',
    '/HeaderDark.svg',
    '/ShareIcon.svg',
    '/ShareIconDark.svg',
    '/omnes-pro-light.otf',
    '/omnes-pro-regular.otf',
    '/omnes-pro-semibold.otf',
    
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
