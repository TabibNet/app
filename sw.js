const CACHE_NAME = 'raheba-med-dynamic-v2'; // تم تغيير الرقم إلى v2 لمسح الكاش القديم
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// تثبيت الـ Service Worker وحفظ الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting(); // تفعيل النسخة الجديدة فوراً
});

// تفعيل الـ Service Worker ومسح الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // مسح الكاش القديم تلقائياً
          }
        })
      );
    })
  );
  self.clients.claim(); // السيطرة على الصفحة فوراً
});

// استراتيجية: الشبكة أولاً (لجلب التحديثات فوراً)
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير الـ GET (مثل إرسال البيانات لفايربيس)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request) // 1. حاول جلب النسخة الجديدة من الإنترنت
      .then((response) => {
        // إذا نجح الطلب، احفظ النسخة الجديدة في الكاش
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response; // اعرض النسخة الجديدة للمستخدم
      })
      .catch(() => {
        // 2. إذا فشل الإنترنت، ابحث في الكاش
        return caches.match(event.request).then((cachedResponse) => {
          // إذا وجد الملف في الكاش اعرضه، وإذا لم تجده اعطِ رداً آمناً بدل أن ينهار المتصفح
          return cachedResponse || new Response('Offline page not available', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
