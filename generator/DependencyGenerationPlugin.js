// Plugin for generation of entry points and aggregation of mixins

const path = require('path');
const { generate, inject } = require('./generator');

class DependencyGenerationPlugin {
  constructor(options) {
    this.options = Object.assign({
      inject: true
    }, options);
  }

  apply(compiler) {

    // Generate at startup
    compiler.hooks.entryOption.tap(
      'DependencyGenerationPlugin',
      (context, entry) => {
        if (!this.options.blocksFolder) {
          this.options.blocksFolder = path.resolve(context, 'blocks');
        }
        if (!this.options.pagesFolders) {
          this.options.pagesFolders = getFolders(context, entry);
        }
        else if (typeof this.options.pagesFolders === 'string') {
          this.options.pagesFolders = [this.options.pagesFolders];
        }
        this.blocks = generate(this.options.blocksFolder, this.options.pagesFolders);

        if (this.options.inject) {
          inject(this.blocks.depFiles);
        }
      }
    );

    // Regenerate in watching mode
    compiler.hooks.invalid.tap(
      'DependencyGenerationPlugin',
      (fileName, changeTime) => {

        // // Don't respond to changes of generated files
        // if (fileName.includes('dependency.')) {
        //   return;
        // }

        // // Use cache: timestamps or hash? What about fs.watch/fs.watchFile
        // // or webpack watch?
        // generator(this.options.blocksFolder, this.options.pagesFolders);
      }
    );
  }
}

function getFolders(context, entry) {
  const entryDirs = new Set();
  if (typeof entry === "string") {
    entryDirs.add(path.resolve(context, path.dirname(entry)));
  }
  else if (Array.isArray(entry)) {
    entry.forEach(file => {
      entryDirs.add(path.resolve(context, path.dirname(file)));
    });
  }
  else {
    for (point of Object.entries(entry)) {
      const [name, files] = point;
      if (typeof files === "string") {
        entryDirs.add(path.resolve(context, path.dirname(files)));
      }
      else {
        files.forEach(file => {
          entryDirs.add(path.resolve(context, path.dirname(file)));
        });
      }
    }
  }
  return Array.from(entryDirs);
}

module.exports = DependencyGenerationPlugin;