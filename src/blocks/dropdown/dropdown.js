import './_type/dropdown_type_guests';
import './_type/dropdown_type_conveniences';

(function( $ ) {
  $.fn.dropdown = function( options ) {

    let settings = $.extend({
      total: true,
      sep: ', ',
      wording: [
        (value) => {
          if (value === 1) {
            return value + ' item';
          }
          else {
            return value + ' items';
          }
        }
      ]
    }, options);

    return this.each(function() {

      function update() {
        if (settings.total) {
          const total = values.reduce((prev, current) => prev + current);
          input.val(settings.wording[0](total));
        }
        else {
          let totals = [];
          settings.wording.forEach((fun, index) => {
            totals.push(fun(values[index]));
          });
          input.val(totals.join(settings.sep));
        }
      }

      const $dropdown = $( this );
      const input = $dropdown.find('.field');
      let values = [];
      const items = $dropdown.find('.dropdown__item');
      items.each(function(index, element) {
        const valueField = $( element ).find('.dropdown__item-value');
        values.push(parseInt(valueField.text()));
      });

      update();

      $dropdown.find('.dropdown__total').on('click', function(event) {
        $dropdown.find('.dropdown__list').toggleClass('dropdown__list_hidden');
      });

      items.on('click', '.button', function(event) {
        const button = $( this );
        const item = $( event.delegateTarget );
        const index = item.index();
        const valueField = item.find('.dropdown__item-value');
        if (button.hasClass('dropdown__button_type_decrement')) {
          values[index] -= 1;
          if (values[index] < 1) {
            button.prop('disabled', true);
          }
        }
        else {
          values[index] += 1;
          const decrButton = item.find('.dropdown__button_type_decrement');
          if (decrButton.prop('disabled')) {
            decrButton.prop('disabled', false);
          };
        }
        valueField.text(values[index]);

        update();
      });
    });
  }
})( jQuery );