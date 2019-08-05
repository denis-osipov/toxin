// Plugin for generation entry points

const path = require('path');

// Load main functionality
const generator = require('./generateEntries');

class EntryGenerationPlugin {
  apply(compiler) {
    compiler.hooks.entryOption.tap(
      'EntryGenerationPlugin',
      generator
    );

    compiler.hooks.invalid.tap(
      'EntryGenerationPlugin',
      (fileName, changeTime) => {
        // Avoid infinite generation loop
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

module.exports = EntryGenerationPlugin;