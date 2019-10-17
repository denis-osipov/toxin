$( document ).ready(function(jQery) {
  $( '.date-picker' ).eq(0).find('.input').eq(1).val('19.08.2019');

  const secondDatepicker = $( '.date-picker' ).eq(1).find('.calendar__picker').data('datepicker');
  secondDatepicker.selectDate([new Date(2019, 7, 19), new Date(2019, 7, 23)]);

  $( '.dropdown_type_conveniences' ).each((index, element) => {
    $( element ).data('dropdown').set([2, 2]);
    if (index === 1) {
      $( element ).data('dropdown').expand();
    }
  });

  $( '.dropdown_type_guests' ).each((index, element) => {
    if (index > 0) {
      $( element ).data('dropdown').expand();
      if (index === 2) {
        $( element ).data('dropdown').set([2, 1]);
        $( element ).find('.dropdown__control_type_clear').addClass('button_focused');
      }
    }
  });

  $( '.exp-list' ).eq(1).addClass('exp-list_expanded');
});