function setDoubleDatepicker( jQuery ) {
  $( '.date-picker_double' ).each(function() {
    $( this ).find( '.field' ).datepicker({
      dateFormat: 'dd.mm.yyyy',
      toggleSelected: true,
      multipleDatesSeparator: ' - ',
      range: true,
      moveToOtherMonthsOnSelect: false,
      moveToOtherYearsOnSelect: false,
      clearButton: true,
      showEvent: null,
      onSelect: onSelect
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

    function onSelect(formattedDate, date, inst) {
      if (date.length < 2) {
        return;
      }
    }
  });
}

$( document ).ready( setDoubleDatepicker );