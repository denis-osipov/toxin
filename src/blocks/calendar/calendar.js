import 'air-datepicker';

function setCalendar( jQuery ) {
  $.fn.datepicker.language.ru.monthsShort.forEach(function(value, index, array) {
    array[index] = value.toLowerCase();
  });
  $.fn.datepicker.language.ru.apply = 'Применить';

  $( '.calendar' ).each(function() {
    const calendar = $( this ).datepicker({
      toggleSelected: true,
      range: true,
      moveToOtherMonthsOnSelect: false,
      moveToOtherYearsOnSelect: false,
      clearButton: true,
      showEvent: null,
      prevHtml: '<i class="icon calendar__nav-icon">arrow_back</i>',
      nextHtml: '<i class="icon calendar__nav-icon">arrow_forward</i>',
      navTitles: {
        days: '<span class="text_level_h2">MM yyyy</span>'
      }
    }).data('datepicker');

    calendar.apply = () => {};
    calendar.nav._addButton('apply');
  });
}

$( document ).ready( setCalendar );