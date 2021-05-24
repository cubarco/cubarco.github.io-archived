var CDN_URL = "https://cdn.jsdelivr.net/gh/cubarco/cubarco.github.io@2021-0524-094532-1532"

var urlPrefix = "https://cubl.in";

self.addEventListener("fetch", function (event) {
  if (
    event.request.method == "GET" &&
    event.request.url.startsWith(urlPrefix) &&
    (event.request.url.endsWith("/") ||
      event.request.url.split("#")[0].endsWith("/"))
  ) {
    event.respondWith(cdnNetwork(event.request));
  } else return fetch(event.request);
});

function cdnNetwork(req) {
  var cdnUrl = req.url.replace(urlPrefix, CDN_URL);
  cdnUrl = cdnUrl.split("#")[0];
  cdnUrl += "index.html";
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
