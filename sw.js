/**
 * Service Worker — Offline Capability & PWA (NFR-015.5, NFR-010.6)
 *
 * Implements offline-first caching for static assets and a background sync
 * mechanism for production daily logs. Enables PWA installability on mobile
 * and desktop devices per NFR-014 (Browser/Device Compatibility).
 *
 * Caching Strategy:
 *   - Stale-while-revalidate for static assets (HTML, CSS, JS, images)
 *   - Network-only for /api/ requests (data must be current)
 *   - Offline fallback: serves cached index.html for document requests
 *
 * Background Sync:
 *   - Stores unsent daily logs in IndexedDB when offline
 *   - Syncs to server when network becomes available (sync-daily-logs tag)
 *
 * NFR-015.5 References:
 *   - Cache versioning via CACHE_NAME for cache invalidation
 *   - Automatic cache cleanup on activate (old versions removed)
 *   - Self.skipWaiting() for immediate activation of new SW
 *   - self.clients.claim() for immediate control of all tabs
 *
 * NFR-014 References:
 *   - Lightweight caching for low-bandwidth environments (320px min width)
 *   - PWA installability (manifest + SW registration in index.html)
 *
 * NFR-010.6 References:
 *   - IndexedDB offline storage for pending daily logs
 *   - Stale-while-revalidate ensures content is always available
 *   - Fallback to cached content when network is unavailable
 */

// Cache version — increment to force cache invalidation on deploy
const CACHE_NAME = 'bohloko-v2';

// Static assets pre-cached during SW install
// Covers: homepage, shop, about, contact, login, signup, CSS, JS, translations, logo
const STATIC_ASSETS = [
  '/',
  '/pages/public/index.html',
  '/pages/public/about.html',
  '/pages/public/shop.html',
  '/pages/public/contact.html',
  '/pages/public/login.html',
  '/pages/public/signup.html',
  '/assets/css/public.css',
  '/assets/css/shop.css',
  '/assets/css/admin.css',
  '/assets/js/api.js',
  '/assets/js/admin.js',
  '/assets/js/lang/en.json',
  '/assets/js/lang/st.json',
  '/assets/images/logo.png'
];

/**
 * Install Event — Pre-cache static assets
 * Adds all STATIC_ASSETS to the named cache, then skips waiting
 * to activate immediately (no tab reload required for users).
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/**
 * Activate Event — Clean up old caches
 * Removes any cache that doesn't match the current CACHE_NAME.
 * Uses self.clients.claim() to take control of all open tabs
 * immediately (no refresh needed for existing users).
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch Event — Stale-while-revalidate caching strategy
 * - Skips non-GET requests (POST, PUT, DELETE go straight to network)
 * - Skips /api/ requests (API data must always be fresh)
 * - Returns cached response immediately if available
 * - Fetches fresh copy in background and updates cache
 * - Falls back to cached index.html for document requests when offline
 */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version immediately, update cache in background
        fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse);
          });
        }).catch(() => {});
        return cachedResponse;
      }
      // Not in cache — fetch from network and cache for next time
      return fetch(event.request).then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      }).catch(() => {
        // Offline fallback: serve cached homepage for document requests
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

/**
 * Background Sync Event — Re-sync offline production logs
 * Listens for the 'sync-daily-logs' tag and processes pending
 * logs stored in IndexedDB. This enables field staff to log
 * data offline and have it sync automatically when connectivity
 * is restored (NFR-010.6 — offline capability for field staff).
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-daily-logs') {
    event.waitUntil(syncDailyLogs());
  }
});

/**
 * Sync pending daily logs from IndexedDB to the server.
 * Iterates through all pending logs and attempts to POST each one.
 * On success, removes the log from IndexedDB.
 * On failure, logs the error and waits for the next sync attempt.
 */
async function syncDailyLogs() {
  const db = await openDB();
  const tx = db.transaction('pending-sync', 'readonly');
  const store = tx.objectStore('pending-sync');
  const pending = await getAllFromStore(store);
  
  for (const log of pending) {
    try {
      const response = await fetch('/api/production/daily-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log.data)
      });
      if (response.ok) {
        await deleteFromStore('pending-sync', log.id);
      }
    } catch (e) {
      console.log('Sync failed, will retry:', e);
    }
  }
}

/**
 * Open IndexedDB database for offline storage.
 * Database 'bohloko-offline' with object store 'pending-sync'
 * stores daily log entries that couldn't be sent while offline.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bohloko-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Read all records from an IndexedDB object store.
 * Used to retrieve pending sync items from the 'pending-sync' store.
 */
function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Delete a specific record from an IndexedDB object store by ID.
 * Called after a successful sync to remove the log from the pending queue.
 */
function deleteFromStore(storeName, id) {
  return new Promise((resolve, reject) => {
    const dbReq = indexedDB.open('bohloko-offline', 1);
    dbReq.onsuccess = () => {
      const db = dbReq.result;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(id);
      tx.oncomplete = () => resolve();
    };
    dbReq.onerror = () => reject(dbReq.error);
  });
}