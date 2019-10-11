import './dependencies.js';
import 'air-datepicker';
const connect = require('blocksPath/connect/connect');

function setCalendar( jQuery ) {
  // Use lower case for monthShort
  $.fn.datepicker.language.ru.monthsShort.forEach(function(value, index, array) {
    array[index] = value.toLowerCase();
  });

  $( '.calendar' ).each(function() {
    const calendar = {
      container: $( this ),
      calendar: $( this ).children('.calendar__picker'),
      options: {
        inline: true,
        toggleSelected: true,
        range: true,
        moveToOtherMonthsOnSelect: false,
        moveToOtherYearsOnSelect: false,
        showEvent: null,
        prevHtml: '<i class="icon icon_type_material calendar__nav-icon">arrow_back</i>',
        nextHtml: '<i class="icon icon_type_material calendar__nav-icon">arrow_forward</i>',
        navTitles: {
          days: '<span class="text_level_h2"><span class="calendar__month-name">MM</span> yyyy</span>'
        }
      },
      listen: () => {
        const selector = calendar.calendar.attr('data-date-picker');
        if (selector) {
          let datePicker = calendar.container.siblings(selector).first();
          if (!datePicker.length) {
            datePicker = calendar.container.parents(selector).first();
          }
          datePicker.one('target:ready', (event, input) => {
            Object.assign(calendar.options, { altField: input });
            calendar.init();
          });
        }
        else {
          calendar.init();
        }
      },
      init: () => {
        const picker = calendar.calendar.datepicker(calendar.options).data('datepicker');
        picker.apply = () => {console.log('Applied.')};
        connect(calendar.calendar, '.control');
        console.log(picker);
      }
    };
    calendar.listen();
  });
}

$( document ).ready( setCalendar );