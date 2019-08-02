// Load main functionality
const generator = require('./generateEntries')

class EntryGenerationPlugin {
  apply(compiler) {
    compiler.hooks.entryOption.tap(
      'EntryGenerationPlugin',
      generator
    );
  }
}

module.exports = EntryGenerationPlugin;