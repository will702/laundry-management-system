// Fresh service worker for clean deployment - no existing cache
const CACHE_VERSION = 'mass-laundry-fresh-' + Date.now();

self.addEventListener('install', (event) => {
  console.log('🆕 Fresh Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🔄 Fresh Service Worker: Activating and clearing ALL caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ Deleting ALL cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('✅ All caches cleared - fresh start!');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // No caching for fresh start - always fetch from network
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('localhost')) {
    return fetch(event.request);
  }
  
  // For other requests, always fetch fresh
  event.respondWith(fetch(event.request));
});

