self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Keep a fetch handler so installability checks can detect an active service worker.
self.addEventListener('fetch', () => {});