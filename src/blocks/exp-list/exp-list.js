function setExpandList( jQuery ) {
  $( '.exp-list' ).each(function(index, element) {
    $( element ).find('.exp-list__header').on('click', function(event) {
      $( element ).toggleClass('exp-list_hidden');
    })
  });
}

$( document ).ready( setExpandList );