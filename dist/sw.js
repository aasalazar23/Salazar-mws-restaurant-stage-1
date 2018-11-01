var CACHE_NAME = 'restaurant-v4';
var urlsToCache = [
  '/',
  '/css/styles.css',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/index.html',
  '/restaurant.html',
];


self.addEventListener('install', function(event) {
  // perform install
  event.waitUntil(
      caches.open(CACHE_NAME)
          .then(function(cache) {
            //console.log('opened cache');
            return cache.addAll(urlsToCache);
          })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
      caches.match(event.request)
          .then(function(response) {
            // cache hit - return response
            if (response) {
              //console.log('yay returned our cache!');
              return response;
            }
            // must clone request. each stream can only be used once
            let fetchRequest = event.request.clone();

            return fetch(fetchRequest).then(
                function(response) {
                  // checks for valid response
                  if (!response ) {
                    return response;
                  }
                  // must clone response. each stream can only be used once
                  let responseToCache = response.clone();
                  caches.open(CACHE_NAME)
                      .then(function(cache) {
                        cache.put(event.request, responseToCache);
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
        //console.log(cacheNames);
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
