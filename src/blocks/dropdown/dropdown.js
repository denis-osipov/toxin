// Automatically generated imports.
// Any changes in this block will be discarded during next compilation.
import './_type_conveniences/dropdown_type_conveniences.js';
import './_type_guests/dropdown_type_guests.js';
import './__total/dropdown__total.js';
import '../control/control.js';
// End of block with automatically generated imports.
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
//                                 // function get integer and array of words and must return formatted string,
//   words: ['item', 'items']      // an array of words for using by wording function
//   control                       // string containing jQuery selector for control element
//   maxGroups                      // should be integer to denote maximum number of showed groups
// };

const connect = require('blocksPath/connect/connect');

(function( $ ) {
  // Main method creating dropdown
  $.fn.dropdown = function( options ) {

    const settings = $.extend( {}, $.fn.dropdown.defaults, options);

    return this.each(function() {

      const dropdown = {
        dropdown: $( this ),
        init: function() {
          dropdown.settings = settings;
          dropdown.update = $.fn.dropdown.update;
          dropdown.expand = $.fn.dropdown.expand.bind(dropdown.dropdown);
          dropdown.change = $.fn.dropdown.change.bind(this);
          dropdown.set = $.fn.dropdown.set.bind(this);
          dropdown.apply = $.fn.dropdown.apply;
          dropdown.clear = $.fn.dropdown.clear.bind(this);
          dropdown.setElements();
          dropdown.setValues();
        },
        setElements: function() {
          dropdown.input = dropdown.dropdown.find('.input');
          dropdown.items = dropdown.dropdown.find('.dropdown__item');
          dropdown.total = dropdown.dropdown.find('.dropdown__total');
          dropdown.list = dropdown.dropdown.find('.dropdown__list');
        },
        setValues: function() {
          dropdown.values = [];
          dropdown.items.find('.dropdown__item-value').each(function(index, element) {
            dropdown.values.push(parseInt($( element ).val()));
          });
        }
      };
      dropdown.init();

      dropdown.total.on('click', dropdown.expand);
      dropdown.items.on('click', '.dropdown__button', dropdown.change);

      $( document ).on('click', function(event) {
        const target = $( event.target );
        const parentDropdown = target.closest('.dropdown');
        if (
          !(parentDropdown[0] === dropdown.dropdown[0]) &&
          target.parent().length
        ) {
          dropdown.dropdown.removeClass('dropdown_expanded');
        }
      });

      $.data(this, 'dropdown', dropdown);

      if (dropdown.settings.control) {
        connect(dropdown.dropdown, dropdown.settings.control, null, dropdown.update.bind(dropdown));
      }

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
    if (sum === 0) {
      this.dropdown.trigger('target:changeButtonStatus', {action: 'clear', disabled: true});
    }
    else {
      this.dropdown.trigger('target:changeButtonStatus', {action: 'clear', disabled: false});
    }

    // Construct total input value
    // One total value
    if (this.settings.total && !this.settings.special.length) {
      this.input.val(this.settings.wording(sum, this.settings.words));
    }
    // Total value and special cases
    else if (this.settings.total && this.settings.special.length) {
      const values = this.values.slice();
      let totals = [];
      this.settings.special.forEach((specialCase) => {
        let sum = 0;
        specialCase.index.forEach((index) => {
          sum += values[index];
          values[index] = 0;
        });
        if (sum > 0 || this.settings.zeroSpecial) {
          totals.push(specialCase.wording(sum, specialCase.words));
        }
      });
      const generalSum = values.reduce((prev, current) => prev + current);
      totals.splice(0, 0, this.settings.wording(generalSum, this.settings.words));
      let value = totals.slice(0, this.settings.maxGroups).join(this.settings.sep);
      if (this.settings.maxGroups < totals.length) {
        value += '...';
      }
      this.input.val(value);
    }
    // All values are separate
    else {
      let totals = [];
      this.settings.wording.forEach((fun, index) => {
        totals.push(fun(this.values[index], this.settings.words[index]));
      });
      let value = totals.slice(0, this.settings.maxGroups).join(this.settings.sep);
      if (this.settings.maxGroups < totals.length) {
        value += '...';
      }
      this.input.val(value);
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
  $.fn.dropdown.format = function(value, words) {
    if (value === 1) {
      return `${value} ${words[0]}`;
    }
    else {
      return `${value} ${words[1]}`;
    }
  };

  $.fn.dropdown.apply = function() {
    console.log('Applied.');
  };

  $.fn.dropdown.clear = function() {
    this.items.each(function(index, element) {
      $( element ).find('.dropdown__item-value').val(0);
      $( element ).find('.dropdown__button_type_decrement').prop('disabled', true);
    });
    this.update();
  }

  $.fn.dropdown.defaults = {
    total: true,
    special: [],
    zeroSpecial: false,
    sep: ', ',
    wording: $.fn.dropdown.format,
    words: ['item', 'items']
  };

})( jQuery );

// Create default dropdown if type is'n unspecified
function setDropdown( jQuery ) {
  $( '.dropdown:not([class*="dropdown_type_"])' ).dropdown();
}

$( document ).ready( setDropdown );