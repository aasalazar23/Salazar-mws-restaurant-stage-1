importScripts('/js/idb.js');
importScripts('/js/dbhelper.js');

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

    if (event.request.url.includes('mapbox') || event.request.url.includes('review')) {
      // prevents storage of mapbox imgs that fill storage quota 
      event.respondWith(
        fetch(event.request).then(function(response) { return response})
        .catch(function() {
          return new Response('sorry, you went offline');
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
);


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


// Thank you twilio! https://www.twilio.com/blog/2017/02/send-messages-when-youre-back-online-with-service-workers-and-background-sync.html
self.addEventListener('sync', function(event) {
  if (event.tag == 'postReview') {
    let db = openDB();
    event.waitUntil(
      DBHelper.handleOfflineReviews(db)
     );
  }
  if (event.tag == 'postFavorite') {
    let db = openDB();
    event.waitUntil(
      DBHelper.handleOfflineFavorites(db)
    );
  }
});


function openDB() {
  const dbPromise = idb.open('restaurantsDB', 1, upgradeDB => {
    //switch (upgradeDB.oldVersion) {
    //  case 0:
        upgradeDB.createObjectStore('restaurantStore', {keyPath: 'id'});
    //  case 1:
        let reviewStore = upgradeDB.createObjectStore('reviewStore', {keyPath: 'createdAt'});

        // creates index by restaurant id, allows nonunique values
        reviewStore.createIndex('restaurant_id', 'restaurant_id', {unique: false});

        upgradeDB.createObjectStore('offlineStore', {keyPath: 'createdAt'});
        upgradeDB.createObjectStore('favoriteStore', {keyPath: 'createdAt'});
   // }
  });

  return dbPromise;
}