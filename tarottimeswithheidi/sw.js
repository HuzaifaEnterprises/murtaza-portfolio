/* TTWH Control Room demo: offline shell.
   Pages: network first, falls back to the last saved copy.
   Same-origin files and Google Fonts: serve saved copy, refresh quietly in the background. */
var VERSION = 'ttwh-cr-v1';
var SHELL = [
  '/tarottimeswithheidi',
  '/tarottimeswithheidi/manifest.json',
  '/tarottimeswithheidi/icons/icon-192.png',
  '/tarottimeswithheidi/icons/icon-512.png',
  '/tarottimeswithheidi/icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION && k.indexOf('ttwh-cr-') === 0; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  var fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !fonts) return;
  if (sameOrigin && url.pathname.indexOf('/tarottimeswithheidi') !== 0) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put('/tarottimeswithheidi', copy); });
        return res;
      }).catch(function () {
        return caches.match('/tarottimeswithheidi');
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
