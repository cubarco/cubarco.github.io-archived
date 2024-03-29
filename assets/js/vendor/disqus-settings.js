// DisqusJS blocks gist-async
function loadDisqus() {
  var dsqjs = new DisqusJS({
    shortname: window.disqus_shortname,
    siteName: window.disqus_siteName,
    api: window.disqus_api,
    apikey: window.disqus_apikey,
    admin: window.disqus_admin,
    adminLabel: window.disqus_adminLabel,
  });
}

var runningOnBrowser = typeof window !== "undefined";
var isBot =
  (runningOnBrowser && !("onscroll" in window)) ||
  (typeof navigator !== "undefined" &&
    /(gle|ing|ro|msn)bot|crawl|spider|yand|duckgo/i.test(navigator.userAgent));
var supportsIntersectionObserver =
  runningOnBrowser && "IntersectionObserver" in window;

setTimeout(function () {
  if (!isBot && supportsIntersectionObserver) {
    var disqus_observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          loadDisqus();
          disqus_observer.disconnect();
        }
      },
      { threshold: [0] }
    );
    disqus_observer.observe(document.getElementById("disqus_thread"));
  } else {
    loadDisqus();
  }
}, 1);
