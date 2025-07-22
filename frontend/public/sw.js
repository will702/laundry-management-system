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

// Handle API requests with cache-first strategy for GET, network-first for POST/PUT/DELETE
async function handleApiRequest(request) {
  const requestUrl = new URL(request.url);
  const isReadOnlyRequest = request.method === 'GET';
  
  if (isReadOnlyRequest && apiEndpointsToCache.some(endpoint => requestUrl.pathname.includes(endpoint))) {
    try {
      // Try cache first for GET requests
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('[ServiceWorker] Serving API from cache:', request.url);
        // Fetch fresh data in background to update cache
        fetch(request).then(response => {
          if (response.ok) {
            caches.open(API_CACHE_NAME).then(cache => {
              cache.put(request, response.clone());
            });
          }
        }).catch(() => {
          // Network failed, cached version is still valid
        });
        return cachedResponse;
      }
      
      // Fetch from network and cache
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(API_CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
      
    } catch (error) {
      console.log('[ServiceWorker] API request failed:', error);
      // Return cached version if available
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return offline indicator for API requests
      return new Response(
        JSON.stringify({ 
          error: 'Offline - Data tidak tersedia', 
          offline: true 
        }), 
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  // For POST/PUT/DELETE requests, always try network first
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[ServiceWorker] Network request failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Offline - Tidak dapat mengirim data', 
        offline: true 
      }), 
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Background sync for offline actions (if supported)
if ('sync' in self.ServiceWorkerRegistration.prototype) {
  self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Background sync:', event.tag);
    
    if (event.tag === 'sync-receipts') {
      event.waitUntil(syncOfflineReceipts());
    }
  });
}

async function syncOfflineReceipts() {
  // Implementation for syncing offline receipts when connection is restored
  console.log('[ServiceWorker] Syncing offline receipts...');
  // This would integrate with IndexedDB to sync offline data
}

// Push notifications (if needed later)
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received:', event);
  
  const title = 'LaundryPro';
  const options = {
    body: event.data ? event.data.text() : 'Notifikasi baru dari LaundryPro',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Buka Aplikasi',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Tutup',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});