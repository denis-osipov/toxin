// Automatically generated imports.
// Any changes in this block will be discarded during next compilation.
import '../toxin/toxin.js';
import '../../blocks/filter/filter.js';
// End of block with automatically generated imports.

$( document ).ready(function(jQery) {

  const reservationDates = $( '.calendar__picker' ).data('datepicker');
  reservationDates.selectDate([new Date(2019, 7, 19), new Date(2019, 7, 23)]);

  const reservationGuests = $( '.dropdown_type_guests' ).data('dropdown');
  reservationGuests.set([2, 1, 1]);

  const conveniences = $( '.dropdown_type_conveniences' ).data('dropdown');
  conveniences.set([2, 2]);

  $( '.room-plate' ).first().addClass('room-plate_active');
});