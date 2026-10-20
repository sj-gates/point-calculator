// 공스코어 서비스 워커
// - 페이지는 항상 인터넷에서 먼저 받아온다(네트워크 우선). 그래서 사이트를 고치면 바로 반영된다.
// - 인터넷이 끊겼을 때만 전에 본 페이지를 기기에 저장해 둔 사본으로 보여 준다.
// - 광고·통계·글꼴처럼 다른 사이트에서 오는 요청은 건드리지 않는다.
const CACHE = 'gongscore-v1';
const PRECACHE = ['/', '/icon-192.png', '/favicon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 페이지 이동: 네트워크 우선, 실패하면 저장본 → 그래도 없으면 홈 저장본
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(url.pathname, copy)); }
          return res;
        })
        .catch(() => caches.match(url.pathname).then(r => r || caches.match('/')))
    );
    return;
  }

  // 같은 사이트의 이미지·아이콘: 네트워크 우선, 끊기면 저장본
  if (/\.(png|svg|ico|webmanifest)$/.test(url.pathname)) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
