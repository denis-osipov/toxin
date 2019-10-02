(function( $ ) {
  // Main method creating control
  $.fn.control = function() {
    return this.each(function() {
      const control = {
        panel: $( this ),
        init: () => {
          control.target = control.findTarget();
          control.buttons = control.findButtons();
          control.plugInButtons();
        },
        findTarget: () => {
          
        }
      };
      console.log(control);
    });
  };
})( jQuery );

// Create default dropdown if type is'n unspecified
function setControl( jQuery ) {
  $( '.control' ).control();
}

$( document ).ready( setControl );