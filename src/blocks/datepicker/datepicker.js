import 'flatpickr';

function setDatepicker( jQuery ) {
  $( '.datepicker__input' ).flatpickr();
}

$( document ).ready( setDatepicker );