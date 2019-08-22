// Plugin for generation of entry points and aggregation of mixins

const path = require('path');
const generator = require('./generators').generateEntries;
const aggregator = require('./generators').aggregateMixins;
const getFileList = require('./generators').getFileList;

class AssetsGenerationPlugin {
  apply(compiler) {

    // Generate at startup
    compiler.hooks.entryOption.tap(
      'AssetsGenerationPlugin',
      (context, entry) => {
        aggregator(context);
        generator(context, entry);
      }
    );

    // Regenerate in watching mode
    compiler.hooks.invalid.tap(
      'AssetsGenerationPlugin',
      (fileName, changeTime) => {

        // Don't respond to changes of generated files
        if (
          fileName === path.resolve(compiler.context, 'blocks/mixins.pug') ||
          fileName === path.resolve(compiler.context, 'blocks/mixins.scss')
        ) {
          return;
        }

        for (let entryPoint of Object.values(compiler.options.entry)) {
          let entryFiles = getFileList(entryPoint, compiler.context);
          for (let file of entryFiles) {
            // Check if invalid file is one of generated
            if (fileName === file) {
              return;
            }
          }
        }
        aggregator(compiler.context);
        generator(compiler.context, compiler.options.entry);
      }
    );
  }
}

module.exports = AssetsGenerationPlugin;