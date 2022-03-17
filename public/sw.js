var cacheName = 'JCV-GROUP';//<- Cache
var filesToCache = [
    '/',
    '/index.js',
    '/index.html',
    '/manifest.json'
];
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      //console.log(cacheName)
      //return cache.addAll(filesToCache);
    })
  );
});
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});