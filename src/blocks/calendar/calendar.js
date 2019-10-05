import './dependencies.js';
import 'air-datepicker';
const connect = require('blocksPath/connect/connect');

function setCalendar( jQuery ) {
  $.fn.datepicker.language.ru.monthsShort.forEach(function(value, index, array) {
    array[index] = value.toLowerCase();
  });

  $( '.calendar__picker' ).each(function() {
    const calendar = $( this ).datepicker({
      toggleSelected: true,
      range: true,
      moveToOtherMonthsOnSelect: false,
      moveToOtherYearsOnSelect: false,
      showEvent: null,
      prevHtml: '<i class="icon calendar__nav-icon">arrow_back</i>',
      nextHtml: '<i class="icon calendar__nav-icon">arrow_forward</i>',
      navTitles: {
        days: '<span class="text_level_h2"><span class="calendar__month-name">MM</span> yyyy</span>'
      }
    }).data('datepicker');

    calendar.apply = () => {console.log('Applied.')};

    connect($( this ), '.control');
  });
}

$( document ).ready( setCalendar );