(function ($) {
  "use strict";

  var $window = $(window);

  // :: Nav Active Code
  if ($.fn.classyNav) {
    $("#essenceNav").classyNav();
  }

  // :: Sliders Active Code
  if ($.fn.owlCarousel) {
    $(".popular-products-slides").owlCarousel({
      items: 4,
      margin: 30,
      loop: true,
      nav: false,
      dots: false,
      autoplay: true,
      autoplayTimeout: 5000,
      smartSpeed: 1000,
      responsive: {
        0: {
          items: 1,
        },
        576: {
          items: 2,
        },
        768: {
          items: 3,
        },
        992: {
          items: 4,
        },
      },
    });
    $(".product_thumbnail_slides").owlCarousel({
      items: 1,
      margin: 0,
      loop: true,
      nav: true,
      navText: [
        "<img src='img/core-img/long-arrow-left.svg' alt=''>",
        "<img src='img/core-img/long-arrow-right.svg' alt=''>",
      ],
      dots: false,
      autoplay: true,
      autoplayTimeout: 5000,
      smartSpeed: 1000,
    });
  }

  // :: ScrollUp Active Code
  if ($.fn.scrollUp) {
    $.scrollUp({
      scrollSpeed: 1000,
      easingType: "easeInOutQuart",
      scrollText: '<i class="fa fa-angle-up" aria-hidden="true"></i>',
    });
  }

  // :: Sticky Active Code
  $window.on("scroll", function () {
    if ($window.scrollTop() > 0) {
      $(".header_area").addClass("sticky");
    } else {
      $(".header_area").removeClass("sticky");
    }
  });

  // :: Nice Select Active Code
  if ($.fn.niceSelect) {
    $("select").niceSelect();
  }

  // :: Slider Range Price Active Code
  $(".slider-range-price").each(function () {
    var min = jQuery(this).data("min");
    var max = jQuery(this).data("max");
    var unit = jQuery(this).data("unit");
    var value_min = jQuery(this).data("value-min");
    var value_max = jQuery(this).data("value-max");
    var label_result = jQuery(this).data("label-result");
    var step = jQuery(this).data("step");

    var t = $(this);
    $(this).slider({
      range: true,
      min: min,
      max: max,
      values: [value_min, value_max],
      step: step,
      slide: function (event, ui) {
        var result =
          label_result +
          " " +
          unit +
          ui.values[0] +
          " - " +
          unit +
          ui.values[1];
        t.closest(".slider-range").find(".range-price").html(result);
        t.closest(".slider-range")
          .find(".range-price")
          .attr("data-min", ui.values[0]);
        t.closest(".slider-range")
          .find(".range-price")
          .attr("data-max", ui.values[1]);
      },
    });
  });

  // :: Favorite Button Active Code
  var favme = $(".favme");

  favme.on("click", function () {
    $(this).toggleClass("active");
  });

  favme.on("click touchstart", function () {
    $(this).toggleClass("is_animating");
  });

  favme.on("animationend", function () {
    $(this).toggleClass("is_animating");
  });

  // :: Nicescroll Active Code
  if ($.fn.niceScroll) {
    $(".cart-list, .cart-content").niceScroll();
  }

  // :: wow Active Code
  if ($window.width() > 767) {
    new WOW().init();
  }

  // :: Tooltip Active Code
  if ($.fn.tooltip) {
    $('[data-toggle="tooltip"]').tooltip();
  }
})(jQuery);
