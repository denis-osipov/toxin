import './_type/dropdown_type_guests';
import './_type/dropdown_type_conveniences';

(function( $ ) {
  $.fn.dropdown = function( options ) {

    const settings = $.extend( {}, $.fn.dropdown.defaults, options);

    return this.each(function() {

      let dropdown = {
        dropdown: $( this ),
        init: function() {
          dropdown.settings = settings;
          dropdown.update = $.fn.dropdown.update;
          dropdown.expand = $.fn.dropdown.expand;
          dropdown.change = $.fn.dropdown.change.bind(this);
          dropdown.setElements();
          dropdown.setValues();
        },
        setElements: function() {
          dropdown.input = dropdown.dropdown.find('.field');
          dropdown.items = dropdown.dropdown.find('.dropdown__item');
          dropdown.total = dropdown.dropdown.find('.dropdown__total');
          dropdown.list = dropdown.dropdown.find('.dropdown__list');
        },
        setValues: function() {
          dropdown.values = [];
          dropdown.items.each(function(index, element) {
            const valueField = $( element ).find('.dropdown__item-value');
            dropdown.values.push(parseInt(valueField.text()));
          });
        }
      }
      dropdown.init();
      dropdown.update();

      dropdown.total.on('click', dropdown.expand);
      dropdown.items.on('click', '.button', dropdown.change);
    });
  };

  $.fn.dropdown.update = function () {
    if (this.settings.total) {
      const total = this.values.reduce((prev, current) => prev + current);
      this.input.val(this.settings.wording(total));
    }
    else {
      let totals = [];
      this.settings.wording.forEach((fun, index) => {
        totals.push(fun(this.values[index]));
      });
      this.input.val(totals.join(this.settings.sep));
    }
  };

  $.fn.dropdown.expand = function(event) {
    $( event.currentTarget ).siblings('.dropdown__list').toggleClass('dropdown__list_hidden');
  };

  $.fn.dropdown.change = function(event) {
    const button = $( event.target );
    const item = $( event.delegateTarget );
    const index = item.index();
    const valueField = item.find('.dropdown__item-value');
    if (button.hasClass('dropdown__button_type_decrement')) {
      this.values[index] -= 1;
      if (this.values[index] < 1) {
        button.prop('disabled', true);
      }
    }
    else {
      this.values[index] += 1;
      const decrButton = item.find('.dropdown__button_type_decrement');
      if (decrButton.prop('disabled')) {
        decrButton.prop('disabled', false);
      };
    }
    valueField.text(this.values[index]);

    this.update();
  };

  $.fn.dropdown.format = function(value) {
    if (value === 1) {
      return value + ' item';
    }
    else {
      return value + ' items';
    }
  };

  $.fn.dropdown.defaults = {
    total: true,
    sep: ', ',
    wording: $.fn.dropdown.format
  };

})( jQuery );

function setDropdown( jQuery ) {
  $( '.dropdown:not([class*="dropdown_type_"])' ).dropdown();
}

$( document ).ready( setDropdown );