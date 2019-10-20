// Automatically generated imports.
// Any changes in this block will be discarded during next compilation.
import '../toxin/toxin.js';
import '../../blocks/list/list.js';
import '../../blocks/pie-chart/pie-chart.js';
import '../../blocks/comments/comments.js';
import '../../blocks/card/card.js';
// End of block with automatically generated imports.

$( document ).ready(function(jQery) {
  const chart = $( '.pie-chart' ).data('chart');
  chart.setActive(1);

  const reservationDates = $( '.calendar__picker' ).data('datepicker');
  reservationDates.selectDate([new Date(2019, 7, 19), new Date(2019, 7, 23)]);

  const reservationGuests = $( '.dropdown_type_guests' ).data('dropdown');
  reservationGuests.set([2, 1, 0]);
});