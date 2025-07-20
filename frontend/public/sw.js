const CACHE_NAME = 'laundry-pro-v1.0.0';
const API_CACHE_NAME = 'laundry-api-v1.0.0';

// Assets to cache for offline use
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  // Add other static assets as needed
];

// API endpoints to cache
const apiEndpointsToCache = [
  '/api/employees',
  '/api/clients',
  '/api/service-items',
  '/api/settings'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Handle API requests
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Handle static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('[ServiceWorker] Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('[ServiceWorker] Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, return offline page
        if (event.request.destination === 'document') {
          return new Response(
            `<!DOCTYPE html>
            <html>
              <head>
                <title>LaundryPro - Offline</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px; 
                    background: #f5f5f5;
                  }
                  .offline-message {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    max-width: 400px;
                    margin: 0 auto;
                  }
                  .icon { font-size: 48px; margin-bottom: 20px; }
                  h1 { color: #333; margin-bottom: 20px; }
                  p { color: #666; line-height: 1.6; }
                  button {
                    background: #4f46e5;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-top: 20px;
                  }
                </style>
              </head>
              <body>
                <div class="offline-message">
                  <div class="icon">🧺</div>
                  <h1>LaundryPro</h1>
                  <h2>Aplikasi Offline</h2>
                  <p>Anda sedang offline. Beberapa fitur mungkin tidak tersedia, tetapi Anda masih dapat mengakses data yang telah dimuat sebelumnya.</p>
                  <button onclick="window.location.reload()">Coba Lagi</button>
                </div>
              </body>
            </html>`,
            {
              headers: {
                'Content-Type': 'text/html'
              }
            }
          );
        }
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
if ('sync' in window.ServiceWorkerRegistration.prototype) {
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