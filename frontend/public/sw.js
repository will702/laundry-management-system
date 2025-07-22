// Clear cache and force reload when logo updates
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Aktivasi - clearing old cache...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('✅ All cache cleared - forcing clients claim');
      return self.clients.claim();
    })
  );
});

// Force update when new version available
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ Service Worker: Force update requested');
    self.skipWaiting();
  }
});

// Version timestamp to force cache refresh
const CACHE_VERSION = 'mass-laundry-v' + Date.now();
const STATIC_CACHE = CACHE_VERSION + '-static';

self.addEventListener('fetch', (event) => {
  // Don't cache during development or for API calls
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('localhost:3000')) {
    return fetch(event.request);
  }
  
  event.respondWith(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});

