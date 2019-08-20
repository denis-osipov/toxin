// data-pickers for double inputs are coupled:
// for each two sequent the first is for begin date, the second is for end date

function setDoubleDatepicker( jQuery ) {
  $( '.date-picker_double' ).each(function() {
    $( this ).find( '.field' ).datepicker({
      dateFormat: 'dd.mm.yyyy',
      toggleSelected: true,
      range: true,
      moveToOtherMonthsOnSelect: false,
      moveToOtherYearsOnSelect: false,
      clearButton: true,
      showEvent: null,
      onSelect: onSelect.bind(this)
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
      if (date.length < 2 || !inst.visible) {
        return;
      }
      const index = $( this ).index('.date-picker_double');
      setOther(formattedDate, date, inst, index);
    }

    // Set other datepicker's dates and input values
    function setOther(formattedDate, date, inst, index) {
      // If index of current date-picker is even, it's for the beginning date
      // and the pair date-picker is the next one. Otherwise the pair date-picker is the previous one.
      const otherIndex = index % 2 === 0 ? index + 1 : index - 1;
      inst.$el.val(formattedDate.split(inst.opts.multipleDatesSeparator)[index % 2]);
      const otherField = $( '.date-picker_double' ).eq(otherIndex).find('.field');
      let otherPicker = otherField.data('datepicker');
      otherPicker.selectDate(date);
      otherPicker.$el.val(formattedDate.split(inst.opts.multipleDatesSeparator)[(index + 1) % 2]);
    }
  });
}

$( document ).ready( setDoubleDatepicker );