var CACHE_NAME = 'restaurant-v3';
var urlsToCache = [
  '/',
  '/css/styles.css',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/index.html',
  '/restaurant.html',
  '/img/1.jpg',
  '/img/2.jpg',
  '/img/3.jpg',
  '/img/4.jpg',
  '/img/5.jpg',
  '/img/6.jpg',
  '/img/7.jpg',
  '/img/8.jpg',
  '/img/9.jpg',
  '/img/10.jpg',
  'data/restaurants.json',
];


self.addEventListener('install', function(event) {
  // perform install
  event.waitUntil(
      caches.open(CACHE_NAME)
          .then(function(cache) {
            console.log('opened cache');
            return cache.addAll(urlsToCache);
          })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
      caches.match(event.request)
          .then(function(response) {
            // cache hit - return response
            console.log(event.request.url);
            if (response) {
              console.log('yay returned our cache!');
              return response;
            }
            // must clone request. each stream can only be used once
            let fetchRequest = event.request.clone();

            return fetch(fetchRequest).then(
                function(response) {
                  // checks for valid response
                  if (!response || response.status !== 200) {
                    return response;
                  }
                  // must clone response. each stream can only be used once
                  let responseToCache = response.clone();
                  caches.open(CACHE_NAME)
                      .then(function(cache) {
                        cache.put(event.request, responseToCache);
                        console.log('new url response stored: ', event.request.url);
                      });
                  return response;
                }
            );
          })
  );
});


self.addEventListener('activate', function(event) {

  let cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
      caches.keys().then(function(cacheNames) {
        console.log(cacheNames);
        return Promise.all(
            cacheNames.map(function(cacheName) {
              if (cacheWhitelist.indexOf(cacheName) === -1) {
                return caches.delete(cacheName);
              }
            })
        );
      })
  );
});
