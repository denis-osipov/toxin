import 'air-datepicker';
import './_double/date-picker__double'

function setDatepicker( jQuery ) {
  // Use lower case for monthShort
  $.fn.datepicker.language.ru.monthsShort.forEach(function(value, index, array) {
    array[index] = value.toLowerCase();
  });

  $( '.date-picker:not([class*="date-picker_double"])' ).each(function() {
    $( this ).find( '.input' ).datepicker({
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
      let datepicker = $( event.currentTarget ).find('.input').data('datepicker');
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