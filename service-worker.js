const CACHE_NAME = 'tabib-cache-v1';
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// الاستماع لرسائل الإشعارات القادمة من الصفحة الرئيسية
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body } = event.data.payload;
    self.registration.showNotification(title, {
      body: body,
      icon: 'https://z-cdn-media.chatglm.cn/files/981068e8-ce01-48cb-baf4-b93e843f3df9.jpg?auth_key=1885239914-cbdf24db3e384494b76a36d7b2c9a35a-0-3aee9630f51ea0cb177c216a24d9f061',
      badge: 'https://z-cdn-media.chatglm.cn/files/981068e8-ce01-48cb-baf4-b93e843f3df9.jpg?auth_key=1885239914-cbdf24db3e384494b76a36d7b2c9a35a-0-3aee9630f51ea0cb177c216a24d9f061'
    });
  }
});
