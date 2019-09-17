import 'dependencies.js';
import 'ion-rangeslider';

function setSlider( jQuery ) {
  $(".slider__input").ionRangeSlider({
    skin: 'toxin',
    type: 'double',
    min: 600,
    max: 15300,
    from: 5000,
    to: 10000,
    hide_min_max: true,
    hide_from_to: true,
    postfix: '₽',
    values_separator: ' - ',
    onStart: output,
    onChange: output
  });
}

function output(data) {
  const output = $( data.input ).parent().find('.slider__output');
  const value = `${data['from_pretty']}${this.postfix}${this['values_separator']}${data['to_pretty']}${this.postfix}`;
  output.text(value);
}

$( document ).ready( setSlider );