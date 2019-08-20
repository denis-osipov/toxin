import 'ion-rangeslider';

function setSlider( jQuery ) {
  $(".slider").ionRangeSlider({
    skin: 'round',
    type: 'double',
    min: 0,
    max: 15000,
    from: 5000,
    to: 10000,
    hide_min_max: true,
    postfix: '₽'
  });
}

$( document ).ready( setSlider );