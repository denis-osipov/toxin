const wording = require('../../../../utils/wording');

function setConveniences( jQuery ) {
  $( '.dropdown_type_conveniences' ).dropdown({
    total: false,
    maxGroups: 2,
    wording: Array(3).fill(wording),
    words: [
      ['0 спален', 'спальня', 'спальни', 'спален'],
      ['0 кроватей', 'кровать', 'кровати', 'кроватей'],
      ['0 ванных комнат', 'ванная комната', 'ванные комнаты', 'ванных комнаты']
    ]
  });
}

$( document ).ready( setConveniences );