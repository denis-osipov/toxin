$.fn.dropdown = function() {
  $dropdown = this;
  $dropdown.find('.field').click(function(event) {
    $dropdown.find('.dropdown__list').toggleClass('dropdown__list_hidden');
  });
};