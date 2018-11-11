/**
 * Common database helper functions.
 */

// creates indexedDB database object
function openDatabase() {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  const dbPromise = idb.open('restaurantsDB', 2, upgradeDB => {
    switch (upgradeDB.oldVersion) {
      case 0:
        upgradeDB.createObjectStore('restaurantStore', {keyPath: 'id'});
      case 1:
        let reviewStore = upgradeDB.createObjectStore('reviewStore', {keyPath: 'createdAt'});

        // creates index by restaurant id, allows nonunique values
        reviewStore.createIndex('restaurant_id', 'restaurant_id', {unique: false});

        upgradeDB.createObjectStore('offlineStore', {keyPath: 'createdAt'});
    }
  });

  return dbPromise;
}

class DBHelper {
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
   * get cached reviews from indexedDB
   */
  static getCachedReviews(dbPromise) {
    return dbPromise.then(function(db) {
      if (!db) {
        console.log('no review db found');
        return;
      }
      let tx = db.transaction('reviewStore');
      let reviewStore = tx.objectStore('reviewStore');

      return reviewStore.getAll();
    })
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

  static emptyOfflineStore() {
    let restDB = openDatabase();
    restDB.then(db => {
      let tx = db.transaction('offlineStore', 'readwrite');
      let offlineStore = tx.objectStore('offlineStore');

      offlineStore.clear().then(() => console.log('deleted'));
    })
  }


  /** Fetch Reviews By Restaurant
   * 
   */
  static fetchReviewsByRestaurantID(id, callback) {
    const restDB = openDatabase();
    DBHelper.getCachedReviews(restDB)
      .then(reviews => {
        if (reviews && reviews.length > 0 && reviews["restaurant_id"] === id) {
          // if reviews in cache, pass them to callback
          console.log('loaded reviews from db: ', reviews);
          callback(null, reviews);
        }
          // if no reviews in cache, fetch from network
          fetch(DBHelper.REVIEW_URL(id)).then(response => {
            console.log('getting reviews from network');
            if (!response) return;
            return response.json();
          })
          .then(reviews => {
            // put data into indexedDB
            DBHelper.putCachedReviews(restDB, reviews);
            callback(null, reviews);
            console.log('added reviews to db: ', reviews);
          })
      })
      .catch(error => console.error('Error: ', error));
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


