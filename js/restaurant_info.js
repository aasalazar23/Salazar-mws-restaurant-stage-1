let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  DBHelper.registerServiceWorker();
  initMap();
});

/*removes map and links of map from tab order*/
tabOrder = () => {
  var zoom = document.getElementsByClassName('leaflet-control-zoom-in');
  var out = document.getElementsByClassName('leaflet-control-zoom-out');
  var leaf = document.getElementsByClassName('leaflet-control-attribution');
  var map = document.getElementById('map');

  leaf[0].firstChild.setAttribute('tabindex', '-1');
  zoom[0].setAttribute('tabindex', '-1');
  out[0].setAttribute('tabindex', '-1');
  map.setAttribute('tabindex', '-1');
}
/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
      tabOrder();
    }
  });
}  
 
/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      //passes id to fetch reviews
      fetchReviews(id);
      callback(null, restaurant)
    });
  }
}

/**Fetch reviews for current page */
fetchReviews = (id) => {
  DBHelper.fetchReviewsByRestaurantID(id, (error, reviews) =>{
    self.reviews = reviews;
    if (!reviews) {
      console.error(error);
      return;
    }
    fillReviewsHTML(reviews);
  });
}
/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.className = 'info-name';
  name.innerHTML = restaurant.name;
  name.setAttribute("tabindex", "0");
  
  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.className = 'info-cuisine';
  cuisine.innerHTML = restaurant.cuisine_type;
  cuisine.setAttribute("tabindex", "0");
  
  const address = document.getElementById('restaurant-address');
  address.className = 'info-address';
  address.innerHTML = restaurant.address;
  address.setAttribute("tabindex", "0");

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = `/img/${restaurant.photograph}-300px.jpg`;
  image.srcset=`/img/${restaurant.photograph}-original.jpg 700w, /img/${restaurant.photograph}-480px.jpg 400w, /img/${restaurant.photograph}-300px.jpg 200w`;
  image.alt = `Picture of ${restaurant.name} restaurant`;
  image.tabIndex = "0";

  const favorite = document.getElementById('restaurant-fav');
  favorite.innerHTML = `<i class="fa fa-star" aria-label="favorite button" role="button" aria-pressed="false" id="favoriteButton${restaurant.id}">`;
  let ariaFav = document.getElementById(`favoriteButton${restaurant.id}`);
  if (restaurant.is_favorite == "true") {
    favorite.className = 'isFavorite';
    favorite.setAttribute('aria-label', 'Currently favorited, click to unfavorite');
    ariaFav.setAttribute('aria-pressed', 'true');
    ariaFav.setAttribute('aria-label', 'Currently favorited, click to unfavorite');
    favorite.setAttribute('aria-pressed', 'true');
    favorite.setAttribute('name', 'Currently favorited, click to unfavorite');
  } else {
    favorite.className = 'favorite';
    favorite.setAttribute('aria-pressed', 'true');
    favorite.setAttribute('name', 'Currently unfavorited, click to favorite');
  }
  favorite.tabIndex = "0";
  favorite.setAttribute("role", "button");



  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  hours.className = 'restaurant-hours';
  hours.setAttribute("tabindex", "0");
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

const formHTML = `
<form id="reviewForm" method="post" action="${DBHelper.POST_URL()}">
  <label>
    Your name
    <br>
    <input type="text" id="formName" name="name" required>
  </label>
  <br>
  <label>
    Restaurant Rating (between 1 and 5)
    <br>
    <input type="number" id="formRating" name="rating" min="1" max="5" required>
  </label>
  <br>
  <label>
    Review
    <br>
    <input type="text"  id="formComments" name="comments" maxlength="250">
  </label>
  <br>
  <button type="submit" id="formButton">Submit review</button>
</form>`

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews) => {
  const container = document.getElementById('reviews-container');

  const ul = document.getElementById('reviews-list');
  if (!reviews) {
    const noReviewsLi = document.createElement('li');
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    noReviews.className = 'no-reviews';
    noReviewsLi.appendChild(noReviews);
    ul.appendChild(noReviewsLi);
    return;
  }
  reviews.forEach(review => {
    ul.prepend(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create Form HTML
 */
createFormHTML = () => {
  const formContainer = document.getElementById('formContainer');
  formContainer.removeChild(formButton);
  const formDiv = document.createElement('div');
  const id = getParameterByName('id');
  formDiv.className = 'formDiv';
  formDiv.innerHTML = formHTML;
  formContainer.appendChild(formDiv);

  navigator.serviceWorker.ready.then( registration => {
    if ('sync' in registration) {
      const form = document.getElementById('reviewForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('form button clicked');
        let formData = new FormData(e.target);
        formData.append('restaurant_id', id);
        formData.append('createdAt', Date.now());
    
        // creates object with form data
        let review = {};
        formData.forEach(function(value, key) {
          review[key] = value;
        });
    
        //immediately adds review to list
        const ul = document.getElementById('reviews-list');
        ul.prepend(createReviewHTML(review));
    
        // posts review object to offline store
        DBHelper.storeOffline(review).then( () => {
            // register for sync 
            return registration.sync.register('postReview');
          }
        ).catch(err => {
          console.log(err);
        });
        
        formDiv.innerHTML = 'Review submitted!';
      });

    }
  }).catch(err => console.log(err));
}


/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute('tabindex', "0");
  const name = document.createElement('p');
  name.className = 'review-name';
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.className = 'review-date';
  convertTime = new Date(parseInt(review.createdAt));
  reviewTime = `${convertTime.getMonth()}/${convertTime.getDate()}/${convertTime.getFullYear()}`;
  date.innerHTML = reviewTime;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.className = 'review-rating';
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.className = 'review-comments';
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}
/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**click events for form */
formButton = document.getElementById('formButton');
formButton.addEventListener('click', createFormHTML);

/**Update favorite status in database */
navigator.serviceWorker.ready.then( registration => {
  if ('sync' in registration) {
    const fav = document.getElementById('restaurant-fav');
    fav.addEventListener('click', (e) => {
      e.preventDefault();
      const id = getParameterByName('id');
      // gets full restaurant object, put kept clearing other fields
      DBHelper.fetchRestaurantById(id, (error, restaurant) => {
        self.restaurant = restaurant;
        if (!restaurant) {
          console.error(error);
          return;
        }
        let ariaFav = document.getElementById(`favoriteButton${restaurant.id}`);
        
        if (fav.className == 'favorite') {
          // favorites a restaurant 
          fav.className = 'isFavorite';
          ariaFav.setAttribute('aria-pressed', 'true');
          fav.setAttribute('aria-pressed', 'true');
          fav.setAttribute('name', 'Currently unfavorited, click to favorite');

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
          ariaFav.setAttribute('aria-pressed', 'false');
          fav.setAttribute('aria-pressed', 'false');
          fav.setAttribute('name', 'Currently favorited, click to unfavorite');

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

