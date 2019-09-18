import './dependencies.js';
// Dropdown with counting
// Should be setted on inputs: $(selector).dropdown(settings)
//
// Settings is object with all optional properties:
//
// $.fn.dropdown.defaults = {
//   total: true,                  // will result be a sum of values of all items; if false, all items will be presented separately
//   special: [],                  // array of objects { index: [array of indices for items quantified separately],
//                                                       wording: [array of formatting functions] }
//   zeroSpecial: false,           // should special sums be shown if equal to 0
//   sep: ', ',                    // separator for items quantities if total is false
//   wording: $.fn.dropdown.format // if setted must be function (for total: true) or array of functions (for total: false)
//                                 // function get integer and must return formatted string
// };


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
          dropdown.set = $.fn.dropdown.set.bind(this);
          dropdown.setElements();
          dropdown.setValues();
        },
        setElements: function() {
          dropdown.input = dropdown.dropdown.find('.input');
          dropdown.items = dropdown.dropdown.find('.dropdown__item');
          dropdown.total = dropdown.dropdown.find('.dropdown__total');
          dropdown.list = dropdown.dropdown.find('.dropdown__list');
          if (dropdown.dropdown.find('.dropdown__controls').length) {
            dropdown.clear = dropdown.dropdown.find('.dropdown__control_type_clear');
            dropdown.apply = dropdown.dropdown.find('.dropdown__control_type_apply');
          }
        },
        setValues: function() {
          dropdown.values = [];
          dropdown.items.find('.dropdown__item-value').each(function(index, element) {
            dropdown.values.push(parseInt($( element ).val()));
          });
        }
      }
      dropdown.init();
      dropdown.update();

      dropdown.total.on('click', dropdown.expand);
      dropdown.items.on('click', '.dropdown__button', dropdown.change);

      if (dropdown.clear) {
        dropdown.clear.on('click', function() {
          dropdown.items.each(function(index, element) {
            $( element ).find('.dropdown__item-value').val(0);
            $( element ).find('.dropdown__button_type_decrement').prop('disabled', true);
          });
          dropdown.update();
        })
      }

      // Action on Apply button clicking
      // if (dropdown.apply) {
      //   dropdown.apply.on('click', dropdown.expand);
      // }

      $.data(this, 'dropdown', dropdown);

    });
  };

  // Update dropdown's total line
  $.fn.dropdown.update = function () {
    this.setValues();
    
    // Change decrement button status depending on the item value.
    this.values.forEach((value, index) => {
      if (value < 1) {
        $( this.items[index] ).find('.dropdown__button_type_decrement').prop('disabled', true);
      }
      else {
        $( this.items[index] ).find('.dropdown__button_type_decrement').prop('disabled', false);
      }
    });

    // Show or hide Clear button
    const sum = this.values.reduce((prev, current) => {
      return prev + current;
    });
    if (this.dropdown.find('.dropdown__controls').length) {
      if (sum === 0) {
        this.clear.prop('disabled', true);
      }
      else {
        this.clear.prop('disabled', false);
      }
    }

    // Construct total input value
    // One total value
    if (this.settings.total && !this.settings.special.length) {
      this.input.val(this.settings.wording(sum));
    }
    // Total value and special cases
    else if (this.settings.total && this.settings.special.length) {
      let values = this.values.slice();
      let totals = [];
      this.settings.special.forEach((specialCase) => {
        let sum = 0;
        specialCase.index.forEach((index) => {
          sum += values[index];
          values[index] = 0;
        });
        if (sum > 0 || this.settings.zeroSpecial) {
          totals.push(specialCase.wording(sum));
        }
      });
      const generalSum = values.reduce((prev, current) => prev + current);
      totals.splice(0, 0, this.settings.wording(generalSum));
      this.input.val(totals.join(this.settings.sep));
    }
    // All values are separate
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
    this.toggleClass('dropdown_expanded');
  };

  // Change quantity of items and update total
  $.fn.dropdown.change = function(event) {
    const button = $( event.target );
    const item = $( event.delegateTarget );
    const valueField = item.find('.dropdown__item-value');
    let value = parseInt(valueField.val());
    if (button.hasClass('dropdown__button_type_decrement')) {
      value -= 1;
    }
    else {
      value += 1;
    }
    valueField.val(value);

    this.update();
  };

  // Set values for items
  // values must be an array of values to set
  $.fn.dropdown.set = function(values) {
    values.forEach((value, index) => {
      this.items.find('.dropdown__item-value').eq(index).val(value);
    });
    this.update();
  }

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
    special: [],
    zeroSpecial: false,
    sep: ', ',
    wording: $.fn.dropdown.format
  };

})( jQuery );

// Create default dropdown if type is'n unspecified
function setDropdown( jQuery ) {
  $( '.dropdown:not([class*="dropdown_type_"])' ).dropdown();
}

$( document ).ready( setDropdown );