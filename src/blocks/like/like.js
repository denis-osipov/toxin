function setLike( jQuery ) {
  $( '.like' ).each(function(index, element) {
    $( element ).on('click', function(event) {
      const counElement = $( element ).find('.like__count');
      let count = parseInt(counElement.text());
      count = $( element ).hasClass('like_liked') ? --count : ++count;
      counElement.text(count);
      $( element ).toggleClass('like_liked');
    })
  });
}

$( document ).ready( setLike );