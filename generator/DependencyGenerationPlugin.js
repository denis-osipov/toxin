// Plugin for generation of dependency files for BEM-entities.
// Each entity should have js, pug and scss files.
// At least it should have fiele of corresponding type if it uses other
// entity which has such file. Otherway dependencies of this type won't be create.

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
        // Get paths
        if (!this.options.blocksFolder) {
          this.options.blocksFolder = path.resolve(context, 'blocks');
        }
        if (!this.options.pagesFolders) {
          this.options.pagesFolders = getFolders(context, entry);
        }
        else if (typeof this.options.pagesFolders === 'string') {
          this.options.pagesFolders = [this.options.pagesFolders];
        }

        this.generate();
      }
    );

    // Regenerate in watching mode
    compiler.hooks.invalid.tap(
      'DependencyGenerationPlugin',
      (fileName, changeTime) => {

        // Don't respond to changes of generated files (use watchOptions instead?)
        if (Object.values(this.files.depsFiles).includes(fileName)) {
          return;
        }

        // To simplify adding new files we need regenerate dependencies for each invalidation.
        this.generate();
      }
    );
  }

  generate() {
    const prevEntities = this.files ? this.files.entitiesFiles : null;
    const prevDeps = this.files ? this.files.depsBems : null;
    this.files = generate(
      this.options.blocksFolder,
      this.options.pagesFolders,
      prevEntities,
      prevDeps
      );
    if (this.options.inject) {
      inject(this.files.depsFiles);
    }
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