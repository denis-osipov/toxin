// Plugin for mixins aggregation

const path = require('path');

// Load main functionality
const aggregator = require('./aggregateMixins')

class MixinsAggregationPlugin {
  apply(compiler) {
    compiler.hooks.entryOption.tap(
      'MixinsAggregationPlugin',
      aggregator
    );

    compiler.hooks.invalid.tap(
      'MixinsAggregationPlugin',
      (fileName, changeTime) => {
        // Avoid infinite generation loop
        if (fileName !== path.resolve(compiler.context, 'blocks/mixins.pug')) {
          aggregator(compiler.context);
        }
      }
    );
  }
}

module.exports = MixinsAggregationPlugin;