// Plugin for generation of entry points and aggregation of mixins

const path = require('path');
const generator = require('./generators').generateEntries;
const aggregator = require('./generators').aggregateMixins;

class AssetsGenerationPlugin {
  apply(compiler) {
    compiler.hooks.entryOption.tap(
      'AssetsGenerationPlugin',
      (context, entry) => {
        aggregator(context);
        generator(context, entry);
      }
    );

    compiler.hooks.invalid.tap(
      'AssetsGenerationPlugin',
      (fileName, changeTime) => {

        if (fileName !== path.resolve(compiler.context, 'blocks/mixins.pug')) {
          aggregator(compiler.context);
        }

        for (let entry in Object.values(compiler.options.entry)) {
          entry = typeof entry === 'string' ? entry : entry[1];
          if (fileName === path.resolve(compiler.context, entry)) {
            return;
          }
        }
        generator(compiler.context, compiler.options.entry);
      }
    );
  }
}

module.exports = AssetsGenerationPlugin;