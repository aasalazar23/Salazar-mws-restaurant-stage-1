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

    if (event.request.url.includes('mapbox') || event.request.method == "PUT") {
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

self.addEventListener('sync', function(event) {
  if (event.tag == 'postReview') {
    event.waitUntil(
      idb.open('restaurantsDB')
      .then((db) => {
        let tx = db.transaction('offlineStore');
        let offlineStore = tx.objectStore('offlineStore');

        return offlineStore.getAll();
      }).then((posts) => {
        console.log('got all posts from offline store: ', posts);
        return Promise.all(posts.map(post => {
          return fetch(DBHelper.POST_URL(), {
            method: 'POST',
            body: JSON.stringify(post),
          }).then(response => {
            console.log(response);
            idb.open('restaurantsDB').then(db => {
              let tx = db.transaction('offlineStore', 'readwrite');
              let offlineStore = tx.objectStore('offlineStore');
              return offlineStore.delete(post.createdAt);
            });
            console.log('deleted posts from offline');
          })
        }))
      }).catch( err => console.log(err))
    );
  }
  if (event.tag == 'postFavorite') {
    event.waitUntil(
      idb.open('restaurantsDB')
      .then((db) => {
        let tx = db.transaction('favoriteStore');
        let favoriteStore = tx.objectStore('favoriteStore');

        return favoriteStore.getAll();
      }).then((posts) => {
        console.log('got all posts from favoriteStore store: ', posts);
        return Promise.all(posts.map(post => {
          // TODO: change url
          return fetch(DBHelper.POST_URL(), {
            method: 'POST',
            body: JSON.stringify(post),
          }).then(response => {
            console.log(response);
            idb.open('restaurantsDB').then(db => {
              let tx = db.transaction('favoriteStore', 'readwrite');
              let favoriteStore = tx.objectStore('favoriteStore');
              return favoriteStore.delete(post.createdAt);
            });
            console.log('deleted posts from favoriteStore');
          })
        }))
      }).catch( err => console.log(err))
    );
  }
});