const CACHE_NAME = 'studymate-v2';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

/* =========================
   INSTALL
========================= */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});


/* =========================
   ACTIVATE
========================= */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});


/* =========================
   FETCH
========================= */
self.addEventListener('fetch', event => {

  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(networkResponse => {

            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type === 'opaque'
            ) {
              return networkResponse;
            }

            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone);
              });

            return networkResponse;
          })
          .catch(() => {

            /* If page request fails offline */
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }

          });

      })
  );
});


/* =========================
   NOTIFICATION CLICK
========================= */
self.addEventListener('notificationclick', event => {

  event.notification.close();

  event.waitUntil(

    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    .then(clientList => {

      for (const client of clientList) {

        if (
          client.url.startsWith(self.location.origin) &&
          'focus' in client
        ) {
          return client.focus();
        }

      }

      if (clients.openWindow) {
        return clients.openWindow('./');
      }

    })

  );
});
