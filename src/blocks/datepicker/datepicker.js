import './_range/datepicker_range';

function setDatepicker( jQuery ) {
  $( '.datepicker__input:not([class*="datepicker_range_"])' );
}

$( document ).ready( setDatepicker );