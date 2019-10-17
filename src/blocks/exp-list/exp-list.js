// Automatically generated imports.
// Any changes in this block will be discarded during next compilation.
import '../list/list.js';
// End of block with automatically generated imports.
function setExpandList( jQuery ) {
  $( '.exp-list' ).each(function(index, element) {
    $( element ).find('.exp-list__header').on('click', function(event) {
      $( element ).toggleClass('exp-list_expanded');
    })
  });
}

$( document ).ready( setExpandList );