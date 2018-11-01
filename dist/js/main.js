let restaurants,neighborhoods,cuisines;var newMap,markers=[];document.addEventListener("DOMContentLoaded",e=>{DBHelper.registerServiceWorker(),initMap(),fetchNeighborhoods(),fetchCuisines(),tabOrder()}),tabOrder=(()=>{var e=document.getElementsByClassName("leaflet-control-zoom-in"),t=document.getElementsByClassName("leaflet-control-zoom-out");document.getElementsByClassName("leaflet-control-attribution")[0].firstChild.setAttribute("tabindex","-1"),e[0].setAttribute("tabindex","-1"),t[0].setAttribute("tabindex","-1")}),fetchNeighborhoods=(()=>{DBHelper.fetchNeighborhoods((e,t)=>{e?console.error(e):(self.neighborhoods=t,fillNeighborhoodsHTML())})}),fillNeighborhoodsHTML=((e=self.neighborhoods)=>{const t=document.getElementById("neighborhoods-select");t.setAttribute("role","menu"),t.setAttribute("aria-label","Neighborhood Filter Menu"),e.forEach(e=>{const a=document.createElement("option");a.innerHTML=e,a.value=e,a.tabIndex="0",t.append(a)})}),fetchCuisines=(()=>{DBHelper.fetchCuisines((e,t)=>{e?console.error(e):(self.cuisines=t,fillCuisinesHTML())})}),fillCuisinesHTML=((e=self.cuisines)=>{const t=document.getElementById("cuisines-select");t.setAttribute("role","menu"),t.setAttribute("aria-label","Cuisine Filter Menu"),e.forEach(e=>{const a=document.createElement("option");a.innerHTML=e,a.value=e,a.tabIndex="0",t.append(a)})}),initMap=(()=>{self.newMap=L.map("map",{center:[40.722216,-73.987501],zoom:12,keyboard:!1,scrollWheelZoom:!1}),L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",{mapboxToken:"pk.eyJ1IjoiYWFzYWxhemFyMjMiLCJhIjoiY2prd3QyMzEwMDFlYTN2cDRwdGxzc2xxNSJ9.6TWd0k6o60IPKrUBkKxbww",maxZoom:18,attribution:'Map data &copy; <a href="https://www.openstreetmap.org/" tabindex="-1">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/" tabindex="-1">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/" tabindex="-1">Mapbox</a>',id:"mapbox.streets"}).addTo(newMap),updateRestaurants()}),updateRestaurants=(()=>{const e=document.getElementById("cuisines-select"),t=document.getElementById("neighborhoods-select"),a=e.selectedIndex,r=t.selectedIndex,n=e[a].value,s=t[r].value;DBHelper.fetchRestaurantByCuisineAndNeighborhood(n,s,(e,t)=>{e?console.error(e):(resetRestaurants(t),fillRestaurantsHTML())})}),resetRestaurants=(e=>{self.restaurants=[],document.getElementById("restaurants-list").innerHTML="",self.markers&&self.markers.forEach(e=>e.remove()),self.markers=[],self.restaurants=e}),fillRestaurantsHTML=((e=self.restaurants)=>{const t=document.getElementById("restaurants-list");e.forEach(e=>{t.append(createRestaurantHTML(e))}),addMarkersToMap()}),createRestaurantHTML=(e=>{const t=document.createElement("li"),a=document.createElement("img");a.className="restaurant-img",a.src=`/img/${e.photograph}-300px.jpg`,a.srcset=`/img/${e.photograph}-original.jpg 700w, /img/${e.photograph}-480px.jpg 400w, /img/${e.photograph}-300px.jpg 200w`,a.alt=`Picture of ${e.name} restaurant`,a.tabIndex="0",t.append(a);const r=document.createElement("div");r.className="restaurant-card",t.append(r);const n=document.createElement("a");n.className="restaurant-name",n.innerHTML=e.name,n.tabIndex="0",n.href=DBHelper.urlForRestaurant(e),r.append(n);const s=document.createElement("p");s.className="restaurant-neighborhood",s.innerHTML=e.neighborhood,s.tabIndex="0",r.append(s);const o=document.createElement("p");return o.className="restaurant-address",o.innerHTML=e.address,s.tabIndex="0",r.append(o),t}),addMarkersToMap=((e=self.restaurants)=>{e.forEach(e=>{const t=DBHelper.mapMarkerForRestaurant(e,self.newMap);t.on("click",function(){window.location.href=t.options.url}),self.markers.push(t),map=document.getElementById("map"),map.tabIndex=-1})});