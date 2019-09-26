import 'inputmask/dist/inputmask/inputmask.date.extensions';
import 'inputmask/dist/inputmask/jquery.inputmask';

function maskInput( jQuery ) {
  $( '.input_masked_date' ).inputmask('datetime', {
    placeholder: 'ДД.ММ.ГГГГ',
    inputFormat: 'dd.mm.yyyy',
    showMaskOnFocus: true,
    showMaskOnHover: false
  });
}

$( document ).ready( maskInput );