const CACHE_NAME = 'pwa-notifys';
const OFFLINE_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/main.js',
  '/js/modules/constants.js',
  '/js/modules/utils.js',
  '/js/modules/event-bus.js',
  '/js/modules/dom.js',
  '/js/modules/ui-controller.js',
  '/js/modules/push-service.js',
  '/js/modules/app-controller.js',
  '/manifest.json'
];
const notificationIcon = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%230b1220' width='192' height='192'/><rect fill='%234f9dff' x='20' y='20' width='152' height='152' rx='28'/><text x='96' y='106' font-size='76' fill='white' text-anchor='middle' dominant-baseline='middle' font-family='Arial'>🔔</text></svg>";

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isHttpRequest = requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:';
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isApiRequest = requestUrl.pathname.startsWith('/api/');
  if (!isHttpRequest || isApiRequest) {
    return;
  }

  const isNavigationRequest = event.request.mode === 'navigate';

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && isSameOrigin) {
          const cacheableResponse = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, cacheableResponse))
            .catch(() => null);
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) {
          return cached;
        }

        if (isNavigationRequest) {
          return caches.match('/index.html');
        }

        return Response.error();
      })
  );
});

self.addEventListener('push', event => {
  const fallback = {
    title: 'Nova notificação',
    message: 'Você recebeu uma atualização',
    tag: 'default-notification',
    icon: notificationIcon,
    url: '/'
  };

  let data = fallback;
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = fallback;
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || fallback.title, {
      body: data.message || fallback.message,
      icon: data.icon || fallback.icon,
      tag: data.tag || fallback.tag,
      data: { url: data.url || fallback.url }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const client = clientList.find(item => new URL(item.url).pathname === '/');
      if (client) return client.focus();
      return clients.openWindow(targetUrl);
    })
  );
});
