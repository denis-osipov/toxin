import './dependencies.js';

(function( $ ) {
  $.fn.toxinDatePicker = function() {
    return this.each(function() {
      const picker = {
        container: $( this ),
        fields: $( this ).find('.date-picker__field'),
        inputs: $( this ).find('.input'),
        calendar: $( this ).find('.date-picker__calendar'),
        type: $( this ).hasClass('date-picker_double') ? 'double' : 'single',
        months: $.fn.toxinDatePicker.months,
        setDate: (dates) => {
          if (dates[0] === '') {
            $( picker.inputs ).val('');
          }
          else if (picker.type === 'single') {
            const formattedDates = [];
            dates.forEach(date => {
              formattedDates.push(`${date.getDate()} ${picker.months[date.getMonth()]}`);
            });
            $( picker.inputs[0] ).val(formattedDates.join(' - '));
          }
          else {
            dates.forEach((date, index) => {
              $( picker.inputs[index] ).val(date.toLocaleDateString());
            });
          }
        },
        init: () => {
          picker.calendar.hide();

          $( document ).on('click', function(event) {
            const target = $( event.target );
            const parentPicker = target.closest('.date-picker');
            if (
              !(parentPicker[0] === picker.container[0]) &&
              target.parent().length
            ) {
              picker.calendar.hide();
            }
          });

          picker.fields.on('click', function(event) {
            picker.calendar.toggle();
          });

          picker.container.on('calendar:date', function(event, ...dates) {
            picker.setDate(dates);
          });
        }
      };

      picker.init();

    });
  };

  $.fn.toxinDatePicker.months = [
    'янв',
    'фев',
    'мар',
    'апр',
    'май',
    'июн',
    'июл',
    'авг',
    'сен',
    'окт',
    'ноя',
    'дек'
  ];
})( jQuery );

function setDatepicker( jQuery ) {

  $( '.date-picker' ).toxinDatePicker();
}

$( document ).ready( setDatepicker );