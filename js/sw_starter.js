if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        // successful registration
        console.log('Service registration successful with scope: ', registration.scope);
      }, function(err) {
        // failed registration
        console.log('Service worker failed: ', err);
      });
    });
  }