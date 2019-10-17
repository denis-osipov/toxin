// Automatically generated imports.
// Any changes in this block will be discarded during next compilation.
import '../../blocks/input/input.js';
import '../../blocks/dropdown/dropdown.js';
import '../../blocks/date-picker/date-picker.js';
import '../../blocks/subscription/subscription.js';
import '../../blocks/list/list.js';
import '../../blocks/like/like.js';
import '../../blocks/slider/slider.js';
import '../../blocks/exp-list/exp-list.js';
import '../../blocks/comment/comment.js';
// End of block with automatically generated imports.
$( document ).ready(function(jQery) {
  $( '.date-picker' ).eq(0).find('.input').eq(1).val('19.08.2019');

  const secondDatepicker = $( '.date-picker' ).eq(1).find('.calendar__picker').data('datepicker');
  secondDatepicker.selectDate([new Date(2019, 7, 19), new Date(2019, 7, 23)]);

  $( '.dropdown_type_conveniences' ).each((index, element) => {
    $( element ).data('dropdown').set([2, 2]);
    if (index === 1) {
      $( element ).data('dropdown').expand();
    }
  });

  $( '.dropdown_type_guests' ).each((index, element) => {
    if (index > 0) {
      $( element ).data('dropdown').expand();
      if (index === 2) {
        $( element ).data('dropdown').set([2, 1]);
        $( element ).find('.dropdown__control_type_clear').addClass('button_focused');
      }
    }
  });

  $( '.exp-list' ).eq(1).addClass('exp-list_expanded');
});