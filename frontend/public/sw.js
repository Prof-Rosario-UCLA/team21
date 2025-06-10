const CACHE_NAME = 'bruindigest-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache app shell
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        // Try to cache files, but don't fail if some are missing
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.warn(`Failed to cache ${url}:`, error);
              return Promise.resolve();
            })
          )
        );
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Handle API requests differently (including cross-origin API calls)
  if (event.request.url.includes('/api/') || event.request.url.includes('localhost:3001')) {
    console.log('Service Worker: Intercepting API request:', event.request.url);
    event.respondWith(
      // Try cache first for API requests when offline
      caches.match(event.request)
        .then(cachedResponse => {
          // If we have a cached response, check if we're online to update it
          if (cachedResponse) {
            // If online, try to update cache in background but return cached data immediately
            if (navigator.onLine) {
              fetch(event.request)
                .then(response => {
                  if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                      .then(cache => {
                        cache.put(event.request, responseClone);
                      });
                  }
                })
                .catch(() => {
                  // Silently fail background update
                });
            }
            return cachedResponse;
          }
          
          // No cached response, try network
          return fetch(event.request)
            .then(response => {
              // If successful, cache the response for offline use
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // Network failed and no cache, return offline response
              return new Response(
                JSON.stringify({
                  success: false,
                  message: 'Currently offline. Please check your connection.',
                  offline: true,
                  articles: [],
                  daily_summary: null,
                  timestamp: new Date().toISOString()
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: new Headers({
                    'Content-Type': 'application/json'
                  })
                }
              );
            });
        })
    );
  } else if (event.request.url.startsWith(self.location.origin)) {
    // Handle same-origin requests (static files, pages)
    event.respondWith(
      // Try cache first, then network
      caches.match(event.request)
        .then(response => {
          if (response) {
            // Update cache in background if online
            if (navigator.onLine) {
              fetch(event.request)
                .then(fetchResponse => {
                  if (fetchResponse.status === 200) {
                    const responseClone = fetchResponse.clone();
                    caches.open(CACHE_NAME)
                      .then(cache => {
                        cache.put(event.request, responseClone);
                      });
                  }
                })
                .catch(() => {
                  // Silently fail background update
                });
            }
            return response;
          }
          
          // Not in cache, try network
          return fetch(event.request)
            .then(fetchResponse => {
              // Cache successful responses
              if (fetchResponse.status === 200) {
                const responseClone = fetchResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseClone);
                  });
              }
              return fetchResponse;
            })
            .catch(() => {
              // For navigation requests, return the cached index.html
              if (event.request.mode === 'navigate') {
                return caches.match('/')
                  .then(response => {
                    if (response) {
                      return response;
                    }
                    // Fallback offline page
                    return new Response(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>BruinDigest - Offline</title>
                          <meta name="viewport" content="width=device-width, initial-scale=1">
                          <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            .offline { color: #666; }
                          </style>
                        </head>
                        <body>
                          <h1>You're Offline</h1>
                          <p class="offline">Please check your internet connection and try again.</p>
                          <button onclick="window.location.reload()">Retry</button>
                        </body>
                      </html>
                    `, {
                      status: 200,
                      headers: new Headers({
                        'Content-Type': 'text/html'
                      })
                    });
                  });
              }
              
              // For other requests, return a generic offline response
              return new Response('Offline - Content not available', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
  }
});

// Handle background sync (for future offline actions)
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks here
      fetch('/api/articles/today')
        .then(response => {
          if (response.ok) {
            console.log('Background sync: Successfully updated articles');
            // Notify clients about new data
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  type: 'BACKGROUND_SYNC_SUCCESS',
                  data: 'New articles available'
                });
              });
            });
          }
        })
        .catch(error => {
          console.log('Background sync failed:', error);
        })
    );
  }
});

// Handle push notifications (for future use)
self.addEventListener('push', event => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New UCLA trends available!',
    icon: '/logo192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Trends',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ],
    requireInteraction: false,
    tag: 'bruindigest-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification('BruinDigest', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification click received.');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 