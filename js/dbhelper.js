/**
 * Common database helper functions.
 */

// creates indexedDB database object
function openDatabase() {
  if (!navigator.serviceWorker) {
    console.log('no navigator.serviceWorker');
    return Promise.resolve();
  }

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

class DBHelper {
    /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }
  static REVIEW_URL(id) {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews/?restaurant_id=${id}`;
  }
  static POST_URL() {
    const port = 1337;
    return `http://localhost:${port}/reviews`;
  }
  static FAVORITE_URL(restaurant_id) {
    const port = 1337;
    return `http://localhost:${port}/restaurants/${restaurant_id}/?is_favorite=true`;
  }
  static UNFAVORITE_URL(restaurant_id) {
    const port = 1337;
    return `http://localhost:${port}/restaurants/${restaurant_id}/?is_favorite=false`;
  }
  /**---------------------Restaurant Handling -------------------------- */
  /**
   * get cached restaurants from indexedDB
   */
  static getCachedRestaurants(dbPromise) {
    return dbPromise.then(function(db) {
      if (!db) {
        console.log('no db found');
        return;
      }
      let tx = db.transaction('restaurantStore');
      let restStore = tx.objectStore('restaurantStore');

      return restStore.getAll(); // returns a promise
    })
  }
  /**
   * put restaurants in indexedDB
   */
  static putCachedRestaurants(dbPromise, restaurants) {
    return dbPromise.then(function(db) {
      if (!db) return;

      let tx = db.transaction('restaurantStore', 'readwrite');
      let restStore = tx.objectStore('restaurantStore');

      for (var restaurant of restaurants) {
        restStore.put(restaurant);
      }
      tx.complete;
    });
  }
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    const restDB = openDatabase();
    DBHelper.getCachedRestaurants(restDB)
      .then(restaurants => {
        if (restaurants && restaurants.length > 0) {
          // if restaurants in cache, pass them to callback
          console.log('loaded restaurants from db');
          callback(null, restaurants);
        } else {
          // if no restaurants in cache, fetch from network
          fetch(DBHelper.DATABASE_URL).then(response => {
            console.log('getting restaurants from network');
            if (!response) return;
            return response.json();
          })
          .then(restaurants => {
            // put data into indexedDB
            DBHelper.putCachedRestaurants(restDB, restaurants);
            callback(null, restaurants);
            console.log('added restaurants to db');
          })
        }
      })
      .catch(error => console.error('Error: ', error));
  }


 /**---------------------Review Handling -------------------------- */
  /**
   * get cached reviews from indexedDB
   */
  static getCachedReviews(dbPromise, id) {
    return dbPromise.then(db => {
      if (!db) {
        console.log('no review db found');
        return;
      }
      let tx = db.transaction('reviewStore');
      let reviewStore = tx.objectStore('reviewStore');
      return reviewStore.getAll();
    }).then( allReviews => {
      let reviews = [];
      for (let review of allReviews) {
        if (review.restaurant_id == id) {
          reviews.push(review);
        }
      }
      console.log(reviews);
      return reviews;
    });
  }
  /**
   * put reviews in indexedDB
   */
  static putCachedReviews(dbPromise, reviews) {
    return dbPromise.then(function(db) {
      if (!db) {
        console.log('no review db found');
        return;
      }
      let tx = db.transaction('reviewStore', 'readwrite');
      let reviewStore = tx.objectStore('reviewStore');

      for (var review of reviews) {
        reviewStore.put(review);
      }

      tx.complete;
    })
  }
    /**
   * fetch reviews from network
   */
  static fetchReviews(id) {
    return fetch(DBHelper.REVIEW_URL(id)).then(response => {
      console.log('getting reviews from network');
      if (!response) return;
      return response.json();
    })
  }
  /**gets all offline reviews, sends them to network, removes them on success
   * 
   */
  static handleOfflineReviews(db) {
    let restDB = db;
    restDB.then(function(db) {
      let tx = db.transaction('offlineStore');
      let offlineStore = tx.objectStore('offlineStore');

      return offlineStore.getAll();
    }).then((reviews) => {
      console.log('got all posts from offline store', reviews);
      return Promise.all(reviews.map(review => {
        let body = {
          "restaurant_id": review.restaurant_id,
          "name": review.name,
          "rating": review.rating,
          "comments": review.comments
      }
        return fetch(DBHelper.POST_URL(), {
          method: 'POST',
          body: JSON.stringify(body)
        }).then(response => {
          console.log(response);
          restDB.then(db =>{
               let tx = db.transaction('offlineStore', 'readwrite');
               let offlineStore = tx.objectStore('offlineStore');
               return offlineStore.delete(review.createdAt);
          })
        })
      }))
    }).catch(err => console.log(err));
  }
  /**If offline, adds review to this store
   * 
   */
  static storeOffline(review) {
    let restDB = openDatabase();
    return restDB.then(function(db) {
      let tx = db.transaction(['offlineStore', 'reviewStore'], 'readwrite');
      let offlineStore = tx.objectStore('offlineStore');
      let reviewStore = tx.objectStore('reviewStore');
  
      
      reviewStore.put(review);
      offlineStore.put(review);
    });
  }

   /**---------------------Favorite Handling -------------------------- */
  static storeFavorite(restaurant) {
      let restDB = openDatabase();
      return restDB.then(function(db) {
        let tx = db.transaction(['favoriteStore', 'restaurantStore'], 'readwrite');
        let favoriteStore = tx.objectStore('favoriteStore');
        let restaurantStore = tx.objectStore('restaurantStore');
    
        
        restaurantStore.put(restaurant);
        favoriteStore.put(restaurant);
      });
  }
    /**gets all offline favorites, sends them to network, removes them on success
   * 
   */
  static handleOfflineFavorites(db) {
      let restDB = db;
      restDB.then(function(db) {
        let tx = db.transaction('favoriteStore');
        let favoriteStore = tx.objectStore('favoriteStore');

        return favoriteStore.getAll();
      }).then(favorites => {
        console.log('got all posts from favoriteStore store: ', favorites);
        return Promise.all(favorites.map(favorite => {
          let url;
            if (favorite["is_favorite"] == "true") {
              url = DBHelper.FAVORITE_URL(favorite["id"]);
            } else {
              url = DBHelper.UNFAVORITE_URL(favorite["id"]);
            }
            return fetch(url, {
            method: 'PUT',
            body: JSON.stringify(favorite)})
          .then(response => {
            console.log(response);
            restDB.then(db => {
              let tx = db.transaction('favoriteStore', 'readwrite');
              let favoriteStore = tx.objectStore('favoriteStore');
              return favoriteStore.delete(favorite.createdAt);
            })
          })
        }))
      }).catch(err => console.log(err));
    }
  /** Fetch Reviews By Restaurant
   * 
   */


  static fetchReviewsByRestaurantID(id, callback) {
    const restDB = openDatabase();
    // checks to see if connection available
    if (navigator.onLine) {
      //if available, fetch from network and store
    DBHelper.fetchReviews(id)
      .then(reviews => {
        // stores reviews in db 
        DBHelper.putCachedReviews(restDB, reviews);
        callback(null, reviews);
      }).catch(err => console.log(err));
    } else {
      // if offline, get from cache
        DBHelper.getCachedReviews(restDB, id).then(reviews => {
          console.log('reviews from db', reviews);
          callback(null, reviews);
        }).catch(err => console.log(err));
    }
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }
  
  /**
   * Restaurant reviews URL.
   */
  static reviewUrlForRestaurant(restaurant) {
    return (`./reviews/?restaurant_id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      keyboard: false, // removes tabbing 
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }
  



static registerServiceWorker() {
  if (!navigator.serviceWorker) return;
  navigator.serviceWorker.register('/sw.js')
    .then( () => 
        console.log('service worker registered')
    ).catch(err => console.log(err));
}

}


