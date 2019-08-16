import 'inputmask/dist/inputmask/inputmask.date.extensions';
import 'inputmask/dist/inputmask/jquery.inputmask';

function maskInput( jQuery ) {
  $( '.field_masked_date' ).inputmask('datetime', {inputFormat: 'dd.mm.yyyy'});
}

$( document ).ready( maskInput );