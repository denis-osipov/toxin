$( document ).ready(function(jQery) {

  const reservationDates = $( '.card_reservation' ).find('.calendar__picker').data('datepicker');
  reservationDates.selectDate([new Date(2019, 7, 19), new Date(2019, 7, 23)]);

  const reservationGuests = $( '.card_reservation' ).find('.dropdown_type_guests').data('dropdown');
  reservationGuests.set([2, 1]);

  const calendar = $( '.calendar' ).eq(2).find('.calendar__picker').data('datepicker');
  calendar.date = new Date(2019, 7, 8);
  calendar.selectDate([new Date(2019, 7, 19), new Date(2019, 7, 23)]);
  calendar.$el.find('[data-date="8"]').addClass('-current-');

  $( '.room-plate__arrows' ).eq(1).hide();
});