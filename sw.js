var CACHE_NAME = 'restaurant-v4';
var urlsToCache = [
  '/',
  '/css/styles.css',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/idb.js',
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
  if (event.request.method == 'POST') {
    event.respondWith(
       fetch(event.request.clone())
        .then(function(response) { return response})
        .catch(function() {
            console.log('you are offline');
            caches.match(event.request.referrer)
              .then(function(response) {
                console.log(event.request.referrer);
                return response;
              });
        })
    );
  } else {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
              // cache hit - return response
              if (response) return response;
              // must clone request. each stream can only be used once
              let fetchRequest = event.request.clone();
              
              // helps prevent storage quota overflow 
              //if (fetchRequest.url.includes('mapbox')) {
              //  return fetch(fetchRequest)
              //}

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
  }
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
