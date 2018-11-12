let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  DBHelper.registerServiceWorker();
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
  tabOrder();
});

tabOrder = () => {
  var zoom = document.getElementsByClassName('leaflet-control-zoom-in');
  var out = document.getElementsByClassName('leaflet-control-zoom-out');
  var leaf = document.getElementsByClassName('leaflet-control-attribution');

  leaf[0].firstChild.setAttribute('tabindex', '-1');
  zoom[0].setAttribute('tabindex', '-1');
  out[0].setAttribute('tabindex', '-1');
}
/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  //console.log('fetchNeighborhoods from main.js');
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  select.setAttribute('role', 'menubar');
  select.setAttribute('aria-haspopup', 'true');
  select.setAttribute('aria-label', 'Neighborhood Filter Menu');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.setAttribute('role', 'menuitem');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.tabIndex = "0";
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  //console.log('fetchCusines from main.js');
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');
  select.setAttribute('role', 'menubar');
  select.setAttribute('aria-haspopup', 'true');
  select.setAttribute('aria-label', 'Cuisine Filter Menu');
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.setAttribute('role', 'menuitem');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.tabIndex = "0";
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        keyboard: false,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiYWFzYWxhemFyMjMiLCJhIjoiY2prd3QyMzEwMDFlYTN2cDRwdGxzc2xxNSJ9.6TWd0k6o60IPKrUBkKxbww',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/" tabindex="-1">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/" tabindex="-1">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/" tabindex="-1">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();

}


/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
    let buttonFav = document.getElementById(`button${restaurant.id}`);
    if (restaurant.is_favorite == "true") {
      buttonFav.className = 'isFavorite';
      buttonFav.setAttribute('aria-pressed', 'true');
      buttonFav.setAttribute('name', 'Currently favorited, click to unfavorite');
    } else {
      buttonFav.className = 'favorite';
      buttonFav.setAttribute('aria-pressed', 'false');
      buttonFav.setAttribute('name', 'Currently unfavorited, click to favorite');
    }
    favSync(restaurant.id);
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = `/img/${restaurant.photograph}-300px.jpg`;
  image.srcset=`/img/${restaurant.photograph}-original.jpg 700w, /img/${restaurant.photograph}-480px.jpg 400w, /img/${restaurant.photograph}-300px.jpg 200w`;
  image.alt = `Picture of ${restaurant.name} restaurant`;
  image.tabIndex = "0";
  li.append(image);

  const card = document.createElement('div');
  card.className = 'restaurant-card';
  li.append(card);

  const name = document.createElement('a');
  name.className = 'restaurant-name';
  name.innerHTML = restaurant.name;
  name.tabIndex = "0";
  name.href = DBHelper.urlForRestaurant(restaurant);
  card.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.className = 'restaurant-neighborhood';
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.tabIndex = "0";
  card.append(neighborhood);

  const address = document.createElement('p');
  address.className = 'restaurant-address';
  address.innerHTML = restaurant.address;
  neighborhood.tabIndex = "0";
  card.append(address);

  const favorite = document.createElement('button');
  favorite.setAttribute('aria-label', 'favorite button');
  favorite.setAttribute('role', 'button');
  favorite.setAttribute('id', `button${restaurant.id}`);
  favorite.setAttribute('aria-pressed', 'false');
  favorite.innerHTML = `<i class="fa fa-star"id="favoriteButton${restaurant.id}" role="button" aria-label="favorite-button" z-index="-1">`;
  favorite.classList.add('favClass');
  favorite.tabIndex = "0";
  card.append(favorite);

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
    map = document.getElementById('map');
    map.tabIndex = -1;
  });

} 


/**Update favorite status in database */
function favSync(id) {
  navigator.serviceWorker.ready.then( registration => {
    if ('sync' in registration) {
      const fav = document.getElementById(`button${id}`);
      fav.addEventListener('click', (e) => {
        e.preventDefault();
        // gets full restaurant object, put kept clearing other fields
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
          self.restaurant = restaurant;
          if (!restaurant) {
            console.error(error);
            return;
          }
          
          if (fav.className == 'favorite') {
            // favorites a restaurant 
            fav.className = 'isFavorite';
            fav.setAttribute('aria-pressed', 'true');
            fav.setAttribute('name', 'Currently favorited, click to unfavorite');
  
            // sets is_favorite property to true
            restaurant["is_favorite"] = "true";
            DBHelper.storeFavorite(restaurant)
              .then( () => {
                // register for sync 
                return registration.sync.register('postFavorite');}
                ).catch(err => console.log(err));
          } else {
            // unfavorites a restaurant
            fav.className = 'favorite';
            fav.setAttribute('aria-pressed', 'false');
            fav.setAttribute('name', 'Currently unfavorited, click to favorite');
  
            // sets is_favorite property to false
            restaurant["is_favorite"] = "false";
            DBHelper.storeFavorite(restaurant)
            .then( () => {
              // register for sync 
              return registration.sync.register('postFavorite');}
              ).catch(err => console.log(err));
          }
        });
      });
    }
  }).catch(err => console.log(err));
}