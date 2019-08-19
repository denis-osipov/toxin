import 'air-datepicker';

function setDatepicker( jQuery ) {
  // Use lower case for monthShort
  $.fn.datepicker.language.ru.monthsShort.forEach(function(value, index, array) {
    array[index] = value.toLowerCase();
  });

  $( '.date-picker' ).each(function() {
    $( this ).find( '.field' ).datepicker({
      dateFormat: 'dd M',
      toggleSelected: true,
      multipleDatesSeparator: ' - ',
      range: true,
      moveToOtherMonthsOnSelect: false,
      moveToOtherYearsOnSelect: false,
      clearButton: true,
      showEvent: null
    });

    $( this ).find('.date-picker__field').on('click', function(event) {
      let datepicker = $( event.currentTarget ).find('.field').data('datepicker');
      if (!datepicker.visible) {
        datepicker.show.bind(datepicker)();
      }
      else {
        datepicker.hide.bind(datepicker)();
      }
    });
  });
}

$( document ).ready( setDatepicker );