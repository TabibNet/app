const CACHE_NAME = 'raheba-med-v4'; // تغيير الرقم يجبر المتصفح على مسح النسخة القديمة
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// تثبيت النسخة الجديدة وحفظ الملفات الأساسية للعمل بدون إنترنت
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(err => console.log('Cache addAll error:', err))
  );
  self.skipWaiting(); // تفعيل النسخة الجديدة فوراً دون انتظار إغلاق الصفحة
});

// تفعيل النسخة الجديدة ومسح أي كاش قديم
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

// استراتيجية ذكية: جلب التحديث من الإنترنت، وإذا انقطع الإنترنت اعرض المحفوظ
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير GET (مثل إرسال البيانات لفايربيس)
  if (event.request.method !== 'GET') return;

  // تجاهل روابط فايربيس وجوجل والـ CDN (لأنها تتغير ديناميكياً ولا يجب حفظها)
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) {
    return; // دع المتصفح يتعامل معها بشكل طبيعي
  }

  // للملفات المحلية (HTML, CSS, JS, صور): الشبكة أولاً
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // إذا وجدنا النسخة الجديدة في الإنترنت، احفظها في الكاش واعرضها
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse; // اعرض أحدث نسخة للمستخدم
      })
      .catch(() => {
        // إذا انقطع الإنترنت، ابحث عن الملف في الذاكرة المحفوظة واعرضه
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});

// الاستماع لرسالة تحديث الصفحة
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
