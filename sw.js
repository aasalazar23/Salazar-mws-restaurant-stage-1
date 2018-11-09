var staticCacheName = 'restaurant-v4';
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
      caches.open(staticCacheName)
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
    if (event.request.url.includes('mapbox')) {
      // prevents storage of mapbox imgs that fill storage quota 
      event.respondWith(
        fetch(event.request).then(function(response) { return response})
        .catch(function() {
          return response;
        })
      )
    } else {
      event.respondWith(
          caches.match(event.request)
              .then(function(response) {
                // cache hit - return response
                if (response) return response;
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
                      caches.open(staticCacheName)
                          .then(function(cache) {
                            cache.put(event.request, responseToCache);
                          });
                      return response;
                    }
                );
              })
      );
    }
  }
});


self.addEventListener('activate', function(event) {
  event.waitUntil(
      caches.keys().then(function(cacheNames) {
        //console.log(cacheNames);
        return Promise.all(
          cacheNames.filter(function(cacheName) {
            return cacheName.startsWith('restaurant-') &&
              cacheName != staticCacheName;
          }).map(function(cacheName) {
            return cache.delete(cacheName);
          })
        );
      })
  );
});
