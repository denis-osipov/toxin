import './dependencies.js';

$( document ).ready(function(jQery) {

  const footers = $( '.footer' );

  matchMedia('(max-width: 1120px)').addEventListener("change", setCreative);

  function setCreative(e) {
    if (e.matches) {
      footers.addClass('footer_type_creative');
    }
    else {
      footers.removeClass('footer_type_creative');
    }
  }
});