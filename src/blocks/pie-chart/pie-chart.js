(function( $ ) {
  $.fn.chart = function() {
    return this.each(function() {
      const chart = {
        container: $( this ),
        element: $( this ).children('circle'),
        init: () => chart.element.hover($.fn.chart.accent, $.fn.chart.normalize)
      };
      chart.init();
    });
  };

  $.fn.chart.accent = function() {
    $( this ).attr('r', '55');
    $( this ).attr('stroke-width', '10');
    const dash = $( this ).attr('stroke-dasharray');
    const [length, gap] = dash.split(' ');
    $( this ).attr('stroke-dasharray', `${length * 55 / 58} ${gap * 55 / 58}`);
    const offset = $( this ).attr('stroke-dashoffset');
    $( this ).attr('stroke-dashoffset', `${offset * 55 / 58 }`);
  };

  $.fn.chart.normalize = function() {
    $( this ).attr('r', '58');
    $( this ).attr('stroke-width', '4');
    const dash = $( this ).attr('stroke-dasharray');
    const [length, gap] = dash.split(' ');
    $( this ).attr('stroke-dasharray', `${length * 58 / 55} ${gap * 58 / 55}`);
    const offset = $( this ).attr('stroke-dashoffset');
    $( this ).attr('stroke-dashoffset', `${offset * 58 / 55 }`);
  };
})( jQuery );

function setPieChart( jQuery ) {
  $( '.pie-chart svg' ).chart();
}

$( document ).ready( setPieChart );