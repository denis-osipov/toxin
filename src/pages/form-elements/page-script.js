$( document ).ready(function(jQery) {
  const secondDatepicker = $( '.date-picker' ).eq(1).find('.input').data('datepicker');
  secondDatepicker.selectDate(new Date(2019, 7, 19));
  secondDatepicker.selectedDates = [];

  const thirdDatepicker = $( '.date-picker' ).eq(2).find('.input').data('datepicker');
  thirdDatepicker.selectDate([new Date(2019, 7, 19), new Date(2019, 7, 23)]);

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
        $( element ).data('dropdown').set([2, 2]);
      }
    }
  });

  $( '.exp-list' ).eq(1).addClass('exp-list_expanded');
});