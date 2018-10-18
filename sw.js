var CACHE_NAME = "restaurant-v1";
var urlsToCache = [
    '/',
    '/css/styles.css'
];


self.addEventListener('install', function(event) {
    //perform install
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});