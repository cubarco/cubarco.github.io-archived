---
---
var CDN_URL = "{{ site.ghmirror }}"

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
