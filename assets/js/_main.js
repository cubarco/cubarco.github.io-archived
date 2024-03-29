/*! Plugin options and other jQuery stuff */

// Responsive Nav
var navigation = responsiveNav("#site-nav", {
  // Selector: The ID of the wrapper
  animate: true, // Boolean: Use CSS3 transitions, true or false
  transition: 200, // Integer: Speed of the transition, in milliseconds
  label: "<i class='fa fa-bars'></i> Menu", // String: Label for the navigation toggle
  insert: "before", // String: Insert the toggle before or after the navigation
  customToggle: "", // Selector: Specify the ID of a custom toggle
  openPos: "relative", // String: Position of the opened nav, relative or static
  jsClass: "js", // String: 'JS enabled' class which is added to <html> el
  init: function () {}, // Function: Init callback
  open: function () {}, // Function: Open callback
  close: function () {}, // Function: Close callback
});

$("html").click(function () {
  //Hide the menus if visible
  if ($(navigation.wrapper).hasClass("opened")) {
    navigation.toggle();
  }
});

$("#site-nav").click(function (event) {
  event.stopPropagation();
});

// FitVids options
$(function () {
  $("article").fitVids();
});

// Add lightbox class to all image links
$(
  "a[href$='.jpg'],a[href$='.jpeg'],a[href$='.JPG'],a[href$='.png'],a[href$='.gif']"
).addClass("image-popup");

// Magnific-Popup options
$(document).ready(function () {
  $(".image-popup").magnificPopup({
    type: "image",
    tLoading: "Loading image #%curr%...",
    gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0, 1], // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      tError: '<a href="%url%">Image #%curr%</a> could not be loaded.',
    },
    removalDelay: 300, // Delay in milliseconds before popup is removed
    // Class that is added to body when popup is open.
    // make it unique to apply your CSS animations just to this exact popup
    mainClass: "mfp-fade",
  });
});

// SimpleJekyllSearch options
if (window.searchEnabled) {
    $(window).load(function () {
      $(".search-field").jekyllSearch({
        jsonFile: window.ghmirror + "/search.json",
        searchResults: ".search-results",
        template:
          '<li><article><a href="{url}">{title} <span class="entry-date"><time datetime="{date}">{shortdate}</time></span></a></article></li>',
        fuzzy: true,
        noResults: "<p>Nothing found.</p>",
      });
    });
    
    (function ($, window, undefined) {
      var bs = {
        close: $(".close-btn"),
        searchform: $(".search-form"),
        canvas: $(".js-menu-screen"),
        dothis: $(".dosearch"),
      };
    
      bs.dothis.on("click", function () {
        $(".search-wrapper").css({ display: "block" });
        $("body").toggleClass("no-scroll");
        bs.searchform.toggleClass("active");
        bs.searchform.find("input").focus();
        bs.canvas.toggleClass("is-visible");
      });
    
      bs.close.on("click", function () {
        $(".search-wrapper").removeAttr("style");
        $("body").toggleClass("no-scroll");
        bs.searchform.toggleClass("active");
        bs.canvas.removeClass("is-visible");
      });
    })(jQuery, window);
}

$(window).load(function () {
    window.gistAsync()
})
