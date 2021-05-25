importScripts('https://cdn.jsdelivr.net/npm/workbox-cdn@5.1.3/workbox/workbox-sw.js');

workbox.setConfig({
    modulePathPrefix: 'https://cdn.jsdelivr.net/npm/workbox-cdn@5.1.3/workbox/'
});


const CDN_URL = "https://cdn.jsdelivr.net/gh/cubarco/cubarco.github.io@2021-0525-162433-20709"
const { core, precaching, routing, strategies, expiration, cacheableResponse, backgroundSync } = workbox;
const { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } = strategies;
const { ExpirationPlugin } = expiration;
const { CacheableResponsePlugin } = cacheableResponse;

const cacheSuffixVersion = "-2021-0525-162433-20709",
    // precacheCacheName = core.cacheNames.precache,
    // runtimeCacheName = core.cacheNames.runtime,
    maxEntries = 100;

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.map((key) => {
                if (key.includes('disqus-cdn-cache')) return caches.delete(key);
                if (key.includes('disqus-img-cache')) return caches.delete(key);
                if (!key.includes(cacheSuffixVersion)) return caches.delete(key);
            }));
        })
    );
});


core.setCacheNameDetails({
    prefix: 'cubl-blog',
    suffix: cacheSuffixVersion
});

core.skipWaiting();
core.clientsClaim();
precaching.cleanupOutdatedCaches();

/*
 * Precache
 */
precaching.precacheAndRoute(
    [
        { url: CDN_URL + '/assets/css/main.css', revision: null },
        { url: CDN_URL + '/assets/js/vendor/modernizr-2.7.1.custom.min.js', revision: null }
    ],
);

/*
 * Cache File From jsDelivr
 * cdn.jsdelivr.net | shadow.elemecdn.com
 *
 * Method: CacheFirst
 * cacheName: static-immutable
 * cacheTime: 30d
 */

// cdn.jsdelivr.net - cors enabled
routing.registerRoute(
    /.*cdn\.jsdelivr\.net/,
    new CacheFirst({
        cacheName: 'static-immutable' + cacheSuffixVersion,
        fetchOptions: {
            mode: 'cors',
            credentials: 'omit'
        },
        plugins: [
            new ExpirationPlugin({
                maxAgeSeconds: 30 * 24 * 60 * 60,
                purgeOnQuotaError: true
            })
        ]
    })
);

// shadow.elemecdn.com - cors enabled
routing.registerRoute(
    /.*shadow\.elemecdn\.com/,
    new CacheFirst({
        cacheName: 'static-immutable' + cacheSuffixVersion,
        fetchOptions: {
            mode: 'cors',
            credentials: 'omit'
        },
        plugins: [
            new ExpirationPlugin({
                maxAgeSeconds: 30 * 24 * 60 * 60,
                purgeOnQuotaError: true
            })
        ]
    })
);

// unpkg.zhimg.com - cors enabled
routing.registerRoute(
    /.*unpkg\.zhimg\.com/,
    new CacheFirst({
        cacheName: 'static-immutable' + cacheSuffixVersion,
        fetchOptions: {
            mode: 'cors',
            credentials: 'omit'
        },
        plugins: [
            new ExpirationPlugin({
                maxAgeSeconds: 30 * 24 * 60 * 60,
                purgeOnQuotaError: true
            })
        ]
    })
);

/*
 * Disqus API - No Cache
 *
 * Method: networkOnly
 */
routing.registerRoute(
    new RegExp('/disqus/3.0/(.*)'),
    new NetworkFirst({
        cacheName: 'dsqjs-api' + cacheSuffixVersion,
        fetchOptions: {
            mode: 'cors',
            credentials: 'omit'
        },
        networkTimeoutSeconds: 3
    })
);

routing.registerRoute(
    new RegExp('https://cubl\.in\/disqus\/(.*)'),
    new NetworkFirst({
        cacheName: 'dsqjs-api' + cacheSuffixVersion,
        fetchOptions: {
            mode: 'cors',
            credentials: 'omit'
        },
        networkTimeoutSeconds: 3
    })
);

/*
 * Gist - No Cache
 *
 * Method: networkOnly
 */
routing.registerRoute(
    new RegExp('https://cubl\.in\/gist\/(.*)'),
    new NetworkFirst({
        cacheName: 'gist-api' + cacheSuffixVersion,
        fetchOptions: {
            mode: 'cors',
            credentials: 'omit'
        },
        networkTimeoutSeconds: 3
    })
);

/*
 * Disqus Related - No cache
 * disqus.com
 * *.disquscdn.com
 *
 * Method: NetworkOnly
 */
routing.registerRoute(
    new RegExp('^https://(.*)disqus\.com'),
    new NetworkOnly()
);

routing.registerRoute(
    new RegExp('^https://(.*)disquscdn\.com(.*)'),
    new NetworkOnly()
);

/*
 * Others img
 * Method: staleWhileRevalidate
 * cacheName: img-cache
 */
routing.registerRoute(
    // Cache image files
    /.*\.(?:png|jpg|jpeg|svg|gif|webp)/,
    new StaleWhileRevalidate()
);

/*
 * Static Assets
 * Method: staleWhileRevalidate
 * cacheName: static-assets-cache
 */
routing.registerRoute(
    // Cache CSS files
    /.*\.(css|js)/,
    // Use cache but update in the background ASAP
    new StaleWhileRevalidate()
);

/*
 * sw.js - Revalidate every time
 * staleWhileRevalidate
 */
routing.registerRoute(
    '/sw.js',
    new StaleWhileRevalidate()
);

// Route index.html throw CDN.
const urlPrefix = self.registration.scope.replace(/\/$/, '');
const ruleRegex = new RegExp('^' + urlPrefix + '[^#]*/(#[^/]*)*$')
function cdnNetwork(event) {
    const strategy = new StaleWhileRevalidate({cacheName: 'static-immutable' + cacheSuffixVersion});
    var cdnUrl = event.request.url.replace(urlPrefix, CDN_URL).split('#')[0] + 'index.html'
    return strategy.handle({event, request: cdnUrl}).then((response) => {
        if (!response.ok) {
            return fetch('/404.html')
        }
        var newHeaders = new Headers(response.headers);
        newHeaders.set("Content-Type", "text/html");
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
        });
    });
}
routing.registerRoute(
    ruleRegex,
    ({event}) => event.respondWith(cdnNetwork(event))
);


/*
 * Default - Serve as it is
 * networkFirst
 */
routing.setDefaultHandler(
    new NetworkFirst({
        networkTimeoutSeconds: 3
    })
);
