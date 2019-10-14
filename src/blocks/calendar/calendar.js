import './dependencies.js';
import 'air-datepicker';
const connect = require('blocksPath/connect/connect');

(function( $ ) {
  $.fn.calendar = function() {
    return this.each(function() {
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
        init: () => {
          if (calendar.calendar.is('[data-connect]')) {
            Object.assign(calendar.options, {
              onSelect: (formattedDate, date, inst) => {
                calendar.container.trigger('calendar:date', date);
              }
            });
          }
          const picker = calendar.calendar.datepicker(calendar.options).data('datepicker');
          picker.apply = () => {console.log('Applied.')};
          connect(calendar.calendar, '.control');
        }
      };
      calendar.init();
    });
  };
})( jQuery );

function setCalendar( jQuery ) {
  $( '.calendar' ).calendar();
}

$( document ).ready( setCalendar );