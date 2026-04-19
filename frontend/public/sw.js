const CACHE_NAME = 'neonexus-v1.0.0';
const STATIC_CACHE = 'neonexus-static-v1.0.0';
const DYNAMIC_CACHE = 'neonexus-dynamic-v1.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/health',
  '/api/forum/categories',
  '/api/resources'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('[SW] Dynamic cache ready');
        return Promise.resolve();
      })
    ])
  );
  
  // Force waiting service worker to become active
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(cacheName => 
            cacheName !== STATIC_CACHE && 
            cacheName !== DYNAMIC_CACHE &&
            cacheName.startsWith('neonexus-')
          )
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - cache-first strategy for specific endpoints, network-first for others
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'document') {
    // HTML documents - network-first with fallback
    event.respondWith(handleDocumentRequest(request));
  } else {
    // Static assets - cache-first strategy
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle API requests
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const shouldCache = API_CACHE_PATTERNS.some(pattern => 
    url.pathname.includes(pattern)
  );
  
  if (shouldCache) {
    // Cache-first for safe API endpoints
    try {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('[SW] Serving API from cache:', request.url);
        
        // Update cache in background
        fetch(request)
          .then(response => {
            if (response.ok) {
              caches.open(DYNAMIC_CACHE)
                .then(cache => cache.put(request, response.clone()));
            }
          })
          .catch(() => {}); // Ignore background update errors
        
        return cachedResponse;
      }
    } catch (error) {
      console.log('[SW] Cache match failed:', error);
    }
  }
  
  // Network-first for other API requests
  try {
    const response = await fetch(request);
    
    if (response.ok && shouldCache) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network request failed:', error);
    
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for API requests
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This feature is not available offline'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle document requests (HTML pages)
async function handleDocumentRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Document network request failed:', error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to root document for SPA routing
    const rootResponse = await caches.match('/');
    if (rootResponse) {
      return rootResponse;
    }
    
    // Ultimate fallback
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NEONEXUS - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 2rem;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
            }
            .container {
              background: rgba(255,255,255,0.1);
              padding: 2rem;
              border-radius: 1rem;
              backdrop-filter: blur(10px);
            }
            h1 { margin-bottom: 1rem; }
            p { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏥 NEONEXUS</h1>
            <p>You're currently offline</p>
            <p>Please check your connection and try again</p>
            <button onclick="location.reload()" style="
              background: #0ea5e9; 
              color: white; 
              border: none; 
              padding: 0.75rem 1.5rem; 
              border-radius: 0.5rem; 
              cursor: pointer;
              margin-top: 1rem;
              font-size: 1rem;
            ">
              Retry
            </button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  try {
    // Cache first for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Static request failed:', error);
    
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

// Handle background sync
async function doBackgroundSync() {
  // This is where you could retry failed API requests
  // For now, we'll just log that sync happened
  console.log('[SW] Performing background sync...');
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'You have a new message',
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'default',
      actions: [
        {
          action: 'open',
          title: 'Open App'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'NEONEXUS', options)
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});