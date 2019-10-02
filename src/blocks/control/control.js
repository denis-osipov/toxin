(function( $ ) {
  // Main method creating control
  $.fn.control = function() {
    return this.each(function() {
      const control = {
        panel: $( this ),
        listen: () => {
          const targetSelector = control.panel.attr('data-selector');
          control.targetElement = control.panel.siblings(targetSelector).first();
          if (!control.targetElement.length) {
            control.targetElement = control.panel.parents(targetSelector).first();
          }
          control.targetElement.on('target:ready', control.init);
        },
        init: () => {
          control.setTarget();
          control.findButtons();
          control.plugInButtons();
        },
        setTarget: () => {
          const targetDataName = control.panel.attr('data-name');
          control.target = control.targetElement.data(targetDataName);
        },
        findButtons: () => {
          control.buttons = control.panel.children('.control__button');
        },
        plugInButtons: () => {
          control.buttons.each(function() {
            const button = $( this );
            const action = button.attr('data-action');
            button.on('click', control.target[action].bind(control.target));
          });
        }
      };

      control.listen();

      $.data(this, 'control', control);
    });
  };
})( jQuery );

function setControl( jQuery ) {
  $( '.control' ).control();
}

$( document ).ready( setControl );