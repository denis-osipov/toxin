const wording = require('../../../../utils/wording');

function setGuests( jQuery ) {
  $( '.dropdown_type_guests' ).dropdown({
    wording: wording,
    words: ['Сколько гостей', 'гость', 'гостя', 'гостей'],
    special: [
      {
        index: [2],
        wording: wording,
        words: ['', 'младенец', 'младенца', 'младенцев']
      }
    ],
    control: '.control'
  });
}

$( document ).ready( setGuests );