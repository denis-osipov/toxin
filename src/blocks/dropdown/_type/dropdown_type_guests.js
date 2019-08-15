function setGuests( jQuery ) {
  $( '.dropdown_type_guests' ).dropdown({
    total: true,
    wording: (value) => {
      if (value == 0) {
        return 'Сколько гостей';
      }
      else if (value === 1 || (value % 100 !== 11 && value % 10 === 1)) {
        return value + ' гость';
      }
      else if ((function() {
        const remMain = value % 100;
        const remSub = remMain % 10;
        return remSub > 1 && remSub < 5 && !(remMain > 11 && remMain < 15);
      })()) {
        return value + ' гостя';
      }
      else {
        return value + ' гостей';
      }
    }
  });
}

$( document ).ready( setGuests );