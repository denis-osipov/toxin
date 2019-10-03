// Block with buttons controlling target block
// Control panel listen event 'target:changeButtonStatus' from target.
// In the passed object must be two properties:
//   action - action, which the button perform (string)
//   disabled - should the button be disabled (bool)
// To appropriate connection, use connect module (in utils folder).

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
          control.targetElement.one('target:ready', control.init);
          control.targetElement.on('target:changeButtonStatus', control.changeButtonStatus);
        },
        init: () => {
          control.setTarget();
          control.findButtons();
          control.plugInButtons();
          control.panel.trigger('control:inited');

        },
        setTarget: () => {
          const targetDataName = control.panel.attr('data-name');
          control.target = control.targetElement.data(targetDataName);
        },
        findButtons: () => {
          control.buttons = control.panel.children('.control__button');
        },
        plugInButtons: () => {
          control.pluggedButtons = {};
          control.buttons.each(function(index, button) {
            button = $( button );
            const action = button.attr('data-action');
            button.on('click', control.target[action].bind(control.target));
            control.pluggedButtons[action] = button;
          });
        },
        changeButtonStatus: (event, params) => {
          control.pluggedButtons[params.action].prop('disabled', params.disabled);
        }
      };

      control.listen();

      $.data(this, 'control', control);
      $( this ).trigger('control:ready');
    });
  };
})( jQuery );

function setControl( jQuery ) {
  $( '.control' ).control();
}

$( document ).ready( setControl );