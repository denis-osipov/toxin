import './_type/dropdown_type_guests';
import './_type/dropdown_type_conveniences';

(function( $ ) {
  // Main method creating dropdown
  $.fn.dropdown = function( options ) {

    const settings = $.extend( {}, $.fn.dropdown.defaults, options);

    return this.each(function() {

      let dropdown = {
        dropdown: $( this ),
        init: function() {
          dropdown.settings = settings;
          dropdown.update = $.fn.dropdown.update;
          dropdown.expand = $.fn.dropdown.expand.bind(dropdown.dropdown);
          dropdown.change = $.fn.dropdown.change.bind(this);
          dropdown.setElements();
          dropdown.setValues();
        },
        setElements: function() {
          dropdown.input = dropdown.dropdown.find('.field');
          dropdown.items = dropdown.dropdown.find('.dropdown__item');
          dropdown.total = dropdown.dropdown.find('.dropdown__total');
          dropdown.list = dropdown.dropdown.find('.dropdown__list');
          if (dropdown.dropdown.find('.dropdown__controls').length) {
            dropdown.clear = dropdown.dropdown.find('.dropdown__button_type_clear');
            dropdown.apply = dropdown.dropdown.find('.dropdown__button_type_apply');
          }
        },
        setValues: function() {
          dropdown.values = [];
          dropdown.items.find('.dropdown__item-value').each(function(index, element) {
            dropdown.values.push(parseInt($( element ).text()));
          });
        }
      }
      dropdown.init();
      dropdown.update();

      dropdown.total.on('click', dropdown.expand);
      dropdown.items.on('click', '.button', dropdown.change);

      if (dropdown.clear) {
        dropdown.clear.on('click', function() {
          dropdown.items.each(function(index, element) {
            $( element ).find('.dropdown__item-value').text(0);
            $( element ).find('.dropdown__button_type_decrement').prop('disabled', true);
          });
          dropdown.update();
        })
      }

      if (dropdown.apply) {
        dropdown.apply.on('click', dropdown.expand);
      }

      $.data(this, 'dropdown', dropdown);

    });
  };

  // Update dropdown's total line
  $.fn.dropdown.update = function () {
    this.setValues();
    const sum = this.values.reduce((prev, current) => prev + current);
    if (this.dropdown.find('.dropdown__controls').length) {
      if (sum === 0) {
        this.clear.addClass('dropdown__button_hidden');
      }
      else {
        this.clear.removeClass('dropdown__button_hidden');
      }
    }
    if (this.settings.total) {
      this.input.val(this.settings.wording(sum));
    }
    else {
      let totals = [];
      this.settings.wording.forEach((fun, index) => {
        totals.push(fun(this.values[index]));
      });
      this.input.val(totals.join(this.settings.sep));
    }
  };

  // Expand dropdown list
  $.fn.dropdown.expand = function(event) {
    this.find('.dropdown__container').toggleClass('dropdown__container_hidden');
  };

  // Change quantity of items and update total
  $.fn.dropdown.change = function(event) {
    const button = $( event.target );
    const item = $( event.delegateTarget );
    const valueField = item.find('.dropdown__item-value');
    let value = parseInt(valueField.text());
    if (button.hasClass('dropdown__button_type_decrement')) {
      value -= 1;
      if (value < 1) {
        button.prop('disabled', true);
      }
    }
    else {
      value += 1;
      const decrButton = item.find('.dropdown__button_type_decrement');
      if (decrButton.prop('disabled')) {
        decrButton.prop('disabled', false);
      };
    }
    valueField.text(value);

    this.update();
  };

  // Format total string depending on value
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

// Create default dropdown if type is'n unspecified
function setDropdown( jQuery ) {
  $( '.dropdown:not([class*="dropdown_type_"])' ).dropdown();
}

$( document ).ready( setDropdown );