import './dependencies.js';
import 'air-datepicker';

function setDatepicker( jQuery ) {

  $( '.date-picker:not([class*="date-picker_double"])' ).each(function() {

    $( this ).find('.date-picker__field').on('click', function(event) {
      // toggle class for visibility
    });
  });
}

$( document ).ready( setDatepicker );