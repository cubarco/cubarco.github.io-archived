// DisqusJS blocks gist-async
window.addEventListener("load", function() {
    var dsqjs = new DisqusJS({
        shortname: window.disqus_shortname,
        siteName: window.disqus_siteName,
        api: window.disqus_api,
        apikey: window.disqus_apikey,
        admin: window.disqus_admin,
        adminLabel: window.disqus_adminLabel
    });
})
