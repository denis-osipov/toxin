import './dependencies.js';
const connect = require('blocksPath/connect/connect');

function setDatepicker( jQuery ) {

  $( '.date-picker' ).each(function() {

    $( this ).find('.date-picker__field').on('click', function(event) {
      $( this ).parent().find('.date-picker__calendar').toggle();
    });

    connect($( this ), '.date-picker__calendar');
  });
}

$( document ).ready( setDatepicker );