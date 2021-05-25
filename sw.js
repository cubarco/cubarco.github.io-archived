var CDN_URL = "https://cdn.jsdelivr.net/gh/cubarco/cubarco.github.io@2021-0525-081158-5820"

var urlPrefix = self.registration.scope.replace(/\/$/, '');
var ruleRegex = new RegExp('^' + urlPrefix + '[^#]*/(#[^/]*)*$')

self.addEventListener("fetch", function (event) {
  if (
    event.request.method == "GET" &&
      ruleRegex.test(event.request.url)
  ) {
    event.respondWith(cdnNetwork(event.request));
  } else return fetch(event.request);
});

function cdnNetwork(req) {
  var cdnUrl = req.url.replace(urlPrefix, CDN_URL).split('#')[0] + 'index.html'
  return fetch(cdnUrl).then((response) => {
    if (!response.ok) {
      return fetch('/404.html')
    }
    var newHeaders = new Headers(response.headers);
    newHeaders.set("Content-Type", "text/html");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  });
}
