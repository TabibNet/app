const CACHE_NAME = 'raheba-med-v5'; // تم تغيير الإصدار لمسح أي ذاكرة قديمة
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// تثبيت النسخة الجديدة وحفظ الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(err => console.log('Cache error:', err))
  );
  self.skipWaiting();
});

// تفعيل النسخة الجديدة ومسح الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// استراتيجية التعامل مع الطلبات
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير GET (مثل إرسال البيانات لفايربيس)
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // تجاهل الروابط الخارجية (فايربيس، جوجل، الصور الخارجية)
  if (url.origin !== location.origin) {
    return;
  }

  // 1. إذا كان الطلب هو فتح صفحة (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // إذا وجدنا الإنترنت، احفظ الصفحة الجديدة واعرضها
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // إذا انقطع الإنترنت، ابحث عن index.html في الذاكرة واعرضها (هنا يكمن الحل!)
          return caches.match('./index.html').then((cached) => cached || caches.match('./'));
        })
    );
    return;
  }

  // 2. لباقي الملفات (CSS, JS, Images): الشبكة أولاً ثم الكاش
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // إذا انقطع الإنترنت، اعرض الملفات المحفوظة (CSS/JS)
        return caches.match(event.request);
      })
  );
});

// الاستماع لرسالة تحديث الصفحة
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
