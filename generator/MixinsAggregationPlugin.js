// Load main functionality
const aggregator = require('./aggregateMixins')

class MixinsAggregationPlugin {
  apply(compiler) {
    compiler.hooks.entryOption.tap(
      'MixinsAggregationPlugin',
      aggregator
    );
  }
}

module.exports = MixinsAggregationPlugin;