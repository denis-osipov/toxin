// Plugin for generation of dependency files for BEM-entities.

const path = require('path');
const Generator = require('./generator');

class DependencyGenerationPlugin {
  constructor(options) {
    this.options = Object.assign({
      clear: false,
      create: true
    }, options);
  }

  apply(compiler) {
    // Generate at startup
    compiler.hooks.entryOption.tap(
      'DependencyGenerationPlugin',
      (context, entry) => {
        const start = new Date();
        // Get paths
        if (!this.options.folders) {
          this.options.folders = [path.resolve(context, 'blocks')];
          this.options.folders = this.options.folders.concat(getFolders(context, entry));
        }

        this.generator = new Generator(
          this.options.folders,
          this.options.clear,
          this.options.create);
        this.generator.generate();
        const finish = new Date();
        console.log(`Plugin worked ${(finish - start) / 1000} s.`);
      }
    );

    // Regenerate in watching mode
    compiler.hooks.invalid.tap(
      'DependencyGenerationPlugin',
      (fileName, changeTime) => {
        const start = new Date();

        // Don't respond to changes of generated files (use watchOptions instead?)
        // To simplify adding new files we need regenerate dependencies for each invalidation.
        if (!fileName.includes('dependencies')) {
          this.generator.generate();
        }
        const finish = new Date();
        console.log(`Plugin worked ${(finish - start) / 1000} s.`);
      }
    );
  }
}

function getFolders(context, entry) {
  // Get unique paths from entries
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