function setConveniences( jQuery ) {
  $( '.dropdown_type_conveniences' ).dropdown({
    total: false,
    sep: ', ',
    wording: [
      (value) => {
        if (value === 1 || (value % 100 !== 11 && value % 10 === 1)) {
          return value + ' спальня';
        }
        else if ((function() {
          const remMain = value % 100;
          const remSub = remMain % 10;
          return remSub > 1 && remSub < 5 && !(remMain > 11 && remMain < 15);
        })()) {
          return value + ' спальни';
        }
        else {
          return value + ' спален';
        }
      },
      (value) => {
        if (value === 1 || (value % 100 !== 11 && value % 10 === 1)) {
          return value + ' кровать';
        }
        else if ((function() {
          const remMain = value % 100;
          const remSub = remMain % 10;
          return remSub > 1 && remSub < 5 && !(remMain > 11 && remMain < 15);
        })()) {
          return value + ' кровати';
        }
        else {
          return value + ' кроватей';
        }
      },
      (value) => {
        if (value === 1 || (value % 100 !== 11 && value % 10 === 1)) {
          return value + ' ванная комната';
        }
        else if ((function() {
          const remMain = value % 100;
          const remSub = remMain % 10;
          return remSub > 1 && remSub < 5 && !(remMain > 11 && remMain < 15);
        })()) {
          return value + ' ванные комнаты';
        }
        else {
          return value + ' ванных комнат';
        }
      }
    ]
  });
}

$( document ).ready( setConveniences );