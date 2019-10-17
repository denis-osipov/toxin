// Automatically generated imports.
// Any changes in this block will be discarded during next compilation.
import './__main/footer__main.js';
import './__subscription/footer__subscription.js';
// End of block with automatically generated imports.
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