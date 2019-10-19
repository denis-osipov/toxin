(function( $ ) {
  $.fn.chart = function() {
    return this.each(function() {
      const $this = $( this );
      const chart = {
        pie: $this.find('.pie-chart__pie'),
        init: () => {
          chart.accentWidth = chart.pie.attr('data-accent-width');
          chart.pieElements = chart.pie.find('circle');

          chart.setStates();

          chart.pieElements.each(function(index, element) {
            $( element ).hover(
              () => $( element ).attr(chart.states[index].accent),
              () => $( element ).attr(chart.states[index].normal),
            );
          });
        },
        setStates: () => {
          chart.states = [];
          chart.pieElements.each(function(index, element) {
            const $el = $( element );

            const normal = {
              r: $el.attr('r'),
              'stroke-width': $el.attr('stroke-width'),
              'stroke-dasharray': $el.attr('stroke-dasharray'),
              'stroke-dashoffset': $el.attr('stroke-dashoffset')
            }

            const accent = {
              r: normal.r - (chart.accentWidth - normal['stroke-width']) / 2,
              'stroke-width': chart.accentWidth
            }

            const coef = accent.r / normal.r;
            accent['stroke-dashoffset'] = normal['stroke-dashoffset'] * coef;
            const dasharray = [];
            normal['stroke-dasharray'].split(' ').forEach(value => {
              dasharray.push(value * coef);
            });
            accent['stroke-dasharray'] = dasharray.join(' ');

            chart.states.push({ normal: normal, accent: accent });
          });
        },
        setActive: (index) => {
          $( chart.pieElements[index] ).attr(chart.states[index].accent);
        }
      };
      chart.init();

      $.data(this, 'chart', chart);
    });
  };
})( jQuery );

function setPieChart( jQuery ) {
  $( '.pie-chart' ).chart();
}

$( document ).ready( setPieChart );