const CACHE_NAME = 'bohloko-v2';
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse);
          });
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-daily-logs') {
    event.waitUntil(syncDailyLogs());
  }
});

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

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bohloko-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

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
