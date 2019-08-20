$( document ).ready(function(jQery) {
  const secondDateField = $( '.date-picker' ).eq(1).find('.field');
  secondDateField.data('datepicker').selectDate(new Date(2019, 7, 19));
  secondDateField.data('datepicker').selectedDates = [];

  const thirdDateField = $( '.date-picker' ).eq(2).find('.field');
  thirdDateField.data('datepicker').selectDate([new Date(2019, 7, 19), new Date(2019, 7, 23)]);
});