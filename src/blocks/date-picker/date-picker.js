import './dependencies.js';
const connect = require('blocksPath/connect/connect');

function setDatepicker( jQuery ) {

  $( '.date-picker' ).each(function() {

    const field = $( this ).find('.date-picker__field');

    field.on('click', function(event) {
      $( this ).parent().find('.date-picker__calendar').toggle();
    });

    connect(field, '.date-picker__calendar', field.find('.input'));
  });
}

$( document ).ready( setDatepicker );