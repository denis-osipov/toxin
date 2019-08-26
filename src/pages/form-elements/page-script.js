$( document ).ready(function(jQery) {
  const secondDatepicker = $( '.date-picker' ).eq(1).find('.input').data('datepicker');
  secondDatepicker.selectDate(new Date(2019, 7, 19));
  secondDatepicker.selectedDates = [];

  const thirdDatepicker = $( '.date-picker' ).eq(2).find('.input').data('datepicker');
  thirdDatepicker.selectDate([new Date(2019, 7, 19), new Date(2019, 7, 23)]);

  const secondConvDropdown = $( '.dropdown_type_conveniences' ).eq(1).data('dropdown');
  secondConvDropdown.items.each(function(index, element) {
    if (index < 2) {
      $( element ).find('.dropdown__item-value').text(2);
      $( element ).find('.dropdown__button_type_decrement').prop('disabled', false);
    }
  });
  secondConvDropdown.update();
  secondConvDropdown.expand();

  const thirdGuestDropdown = $( '.dropdown_type_guests' ).eq(2).data('dropdown');
  thirdGuestDropdown.items.eq(0).find('.dropdown__item-value').text(2);
  thirdGuestDropdown.items.eq(0).find('.dropdown__button_type_decrement').prop('disabled', false);
  thirdGuestDropdown.items.eq(1).find('.dropdown__item-value').text(1);
  thirdGuestDropdown.items.eq(1).find('.dropdown__button_type_decrement').prop('disabled', false);
  thirdGuestDropdown.update();
  thirdGuestDropdown.expand();

  $( '.exp-list' ).eq(1).removeClass('exp-list_hidden');

  $( '.list_type_checkbox:first' ).find('li').each(function(index, element) {
    if (index > 0) {
      $( element ).find('input').prop('checked', true);
    }
  })

  $( '.list_type_radio:first' ).find('input').eq(0).prop('checked', true);
});