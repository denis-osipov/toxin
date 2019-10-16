// Functions for dependencies generation

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const getBems = require('./get-bems');
const { symmetricDifference, union, intersection, difference } = require('./utils');
const rules = require('./rules');
const eol = require('os').EOL;

// Class for adding imports. Can be used by webpack plugin or in scripts.
class Generator {
  constructor(folders, clear, create) {
    this.folders = folders; // folders to scan
    this.clear = clear; // should be always true in the new version
    this.create = create; // boolean, true if creation of missing files is desired
  }

  // Main method to generate imports
  generate() {
    const start = new Date();
    this.repeat = false;
    this.prevFiles = this.files;
    this.prevDeps = this.deps;
    this.files = {};

    this.folders.forEach(folder => this.scanFolder(folder));

    // Don't regenerate if files weren't changed
    if (!(this.prevFiles && _.isEqual(this.files, this.prevFiles))) {
      this.addDependencies();
    }
    else {
      this.depsFiles = null;
    }

    // Regenerate if new files were added (if this.create is true)
    if (this.repeat) {
      this.generate();
    }
    const finish = new Date();
    console.log(`Generator worked ${(finish - start) / 1000} s.`);
  }

  // Scan folder and get files list, including internal dependencies
  // (elements and modifiers in block folder)
  scanFolder(root, parent) {
    const entities = fs.readdirSync(root, {
      encoding: 'utf-8',
      withFileTypes: true
    });
    entities.forEach(entity => {
      const entityPath = path.join(root, entity.name);
      if (entity.isDirectory()) {
        // Directory name is BEM entity name
        const name = constructName(entityPath, entity.name);
        this.files[name] = {
          files: {},
          folderDependencies: []
        };
        // If current directory isn't one of top-level, it is element or
        // modifier directory. Add it to parent dependencies.
        if (parent) {
          this.files[parent].folderDependencies.push(name);
          this.files[name].parent = parent;
        }
        this.scanFolder(entityPath, name);
      }
      else if (entity.isFile()) {
        // If it's a file, add it to info for corresponding BEM entity
        const fileType = path.extname(entity.name);
        if (fileType in rules) {
          const name = path.basename(entity.name, fileType);
          if (name !== 'dependencies') {
            this.files[name].files[fileType] = Object.assign(
              this.files[parent].files[fileType] || {},
              { path: entityPath, mtime: fs.statSync(entityPath).mtimeMs }
            );
          }
          else {
            this.files[parent].files[fileType] = Object.assign(
              this.files[parent].files[fileType] || {},
              { depFile: entityPath }
            );
          }
        }
      }
    });
  }

  // Add dependencies to this.deps for file and call createDependencies
  addDependencies() {
    this.deps = {};
    this.depsFiles = { toAdd: {}, toRemove: {} };
    Object.entries(this.files).forEach(item => {
      const [itemName, itemInfo] = item;
      this.deps[itemName] = {};

      if (this.prevFiles && _.isEqual(itemInfo, this.prevFiles[itemName])) {
        // If entity wasn't changed, use previous dependencies
        this.deps[itemName] = this.prevDeps[itemName];
      }
      else {
        // Block was changed
        this.deps[itemName].folder = itemInfo.folderDependencies;
        const pugFile = itemInfo.files['.pug'];
        if (!(
          this.prevFiles && // the first generation
          this.prevFiles[itemName] && // new bem entity
          //template was changed
          _.isEqual(pugFile, this.prevFiles[itemName].files['.pug'])
        )) {
          if (pugFile) {
            const exclude = this.getParents(itemName);
            const content = getBems(pugFile.path, exclude);
            // Extends should go first
            this.deps[itemName].content = [content.extends_].concat([...content.bems]);
            this.deps[itemName].extends_ = content.extends_;
          }
        }
        else {
          // If pug file wasn't changed, use previous content and extends
          // dependencies
          this.deps[itemName].content = this.prevDeps[itemName].content;
          this.deps[itemName].extends_ = this.prevDeps[itemName].extends_;
        }
      }

      this.createDependencies(itemName);
    });
  }

  // Get parents to exclude from dependencies list while getting it from pug file
  getParents(itemName) {
    if (this.files[itemName].parent) {
      return [itemName].concat(this.getParents(this.files[itemName].parent));
    }
    else {
      return [itemName];
    }
  }

  // Get file's dependencies for which update is needed and call writeDependencyFiles
  createDependencies(itemName) {
    const existingDeps = this.deps[itemName].content ?
      this.deps[itemName].content.filter(bem => bem in this.files) :
      [];
    const depItems = union(this.deps[itemName].folder, existingDeps);
    if (this.prevFiles && this.prevFiles[itemName]) {
      const deps = {};
      if (this.prevDeps[itemName].content) {
        var prevExistingDeps = this.prevDeps[itemName].content.filter(bem => {
          bem in this.prevFiles
        });
      }
      else {
        var prevExistingDeps = [];
      }
      const allPrevExistingDeps = union(
        this.prevDeps[itemName].folder,
        prevExistingDeps
      );
      deps.removedDeps = difference(allPrevExistingDeps, depItems);
      deps.addedDeps = difference(depItems, allPrevExistingDeps);
      deps.unchangedDeps = intersection(depItems, allPrevExistingDeps);
      var changedExts = this.checkDependencies(deps.unchangedDeps);
      deps.removedDeps.forEach(depName => {
        changedExts = union(
          changedExts,
          Object.keys(this.prevFiles[depName].files)
        );
      });
      deps.addedDeps.forEach(depName => {
        changedExts = union(
          changedExts,
          Object.keys(this.files[depName].files)
        );
      });
    }
    else {
      var changedExts = Object.keys(rules);
    }
    const dependencyFiles = this.getDependencyFiles(depItems, changedExts);
    this.createMissingFiles(itemName, dependencyFiles);
    this.writeDependencyFiles(itemName, dependencyFiles);
  }

  // Check if dependencies files list was changed
  checkDependencies(deps) {
    let changedExts = [];
    deps.forEach(depName => {
      Object.entries(this.prevFiles[depName].files).forEach(file => {
        const [ext, fileInfo] = file;
        if (fileInfo.generated) {
          changedExts.push(ext);
          delete fileInfo.generated;
        }
      });

      changedExts = union(changedExts, (symmetricDifference(
        Object.keys(this.files[depName].files),
        Object.keys(this.prevFiles[depName].files)
      )));
    });
    return changedExts;
  }

  // Get file list for dependencies
  getDependencyFiles(depItems, extensions) {
    const dependencyFiles = {};
    extensions.forEach(ext => {
      dependencyFiles[ext] = [];
    });
    depItems.forEach(depItem => {
      if (this.files[depItem]) {
        // Add only existing files
        Object.entries(this.files[depItem].files).forEach(file => {
          const [ext, fileInfo] = file;
          if (ext in dependencyFiles) {
            dependencyFiles[ext].push(fileInfo.path);
          }
        });
      }
    });
    return dependencyFiles;
  }

  // Write dependencies.* files
  writeDependencyFiles(itemName, dependencyFiles) {
    const extendsFiles = this.deps[itemName].extends_ ?
      this.files[this.deps[itemName].extends_].files :
      {};
    Object.entries(this.files[itemName].files).forEach(itemFile => {
      const [ext, fileInfo] = itemFile;
      if (dependencyFiles[ext]) {
        let neededImports = [];
        dependencyFiles[ext].forEach(depFile => {
          if (extendsFiles[ext] && depFile === extendsFiles[ext].path) {
            var importString = rules[ext].addBem(extendsFiles[ext].path, fileInfo.path, true);
          }
          else {
            var importString = rules[ext].addBem(depFile, fileInfo.path);
          }
          if (importString) {
            neededImports.push(importString);
          }
        });
        
        this.injectImports(fileInfo.path, neededImports);
      }
    });
  }

  // Create missing files (if entity depends on other entity which has files with
  // extension not presented in files of that entity)
  createMissingFiles(itemName, dependencyFiles) {
    Object.entries(dependencyFiles).forEach(depsType => {
      const [ext, paths] = depsType;
      if (paths.length && !this.files[itemName].files[ext] && this.create) {
        const existingFile = Object.values(this.files[itemName].files)[0].path;
        const newFile = path.join(path.dirname(existingFile), itemName + ext);
        fs.writeFileSync(newFile, '');
        this.files[itemName].files[ext] = {
          path: newFile,
          mtime: fs.statSync(newFile).mtimeMs,
          generated: true
        };
        this.repeat = true;
      }
    });
  }

  // Inject import into special block of entity file. If particular import occurs
  // elsewhere outside special block it won't be duplicated.
  injectImports(itemFile, neededImports) {
    const ext = path.extname(itemFile);
    const itemFileContent = fs.readFileSync(itemFile, { encoding: 'utf-8' });
    const blockContent = itemFileContent.match(rules[ext].blockRe);
    const mainContent = itemFileContent.replace(rules[ext].blockRe, '');
    if (!neededImports.length) {
      // There is no need to import
      if (mainContent.match(/\S/)) {
        // File has some content beside import block
        fs.writeFileSync(itemFile, mainContent);
      }
      else if (this.clear && blockContent) {
        // File is empty
        fs.unlinkSync(itemFile);
        this.repeat = true;
      }
      else {
        fs.writeFileSync(itemFile, mainContent);
      }
    }
    else {
      // Need to import some files
      const mainImports = mainContent.match(rules[ext].importsRe);
      const blockImports = blockContent ? blockContent[0].match(rules[ext].importsRe) : [];
      const importsToAdd = difference(neededImports, mainImports);
      if (!_.isEqual(importsToAdd, blockImports)) {
        // Need to change block imports
        if (ext === '.pug' && itemFileContent.match(/^extends .+\s+/m)) {
          // Special case for pug with extends. Include can't be injected elsewhere
          // except block (or mixin)
          const firstBlock = itemFileContent.match(rules[ext].firstBlockRe);
          const splittedContent = itemFileContent.split(firstBlock[1]);
          const indentation = firstBlock[2];
          const newBlock = arrayToString(
            rules[ext].startMessage.concat(importsToAdd).concat(rules[ext].endMessage),
            indentation,
            eol
          );
          splittedContent.splice(1, 0, firstBlock[1], newBlock);
          var newContent = splittedContent.join('');
        }
        else {
          const newBlock = arrayToString(
            rules[ext].startMessage.concat(importsToAdd).concat(rules[ext].endMessage),
            '',
            eol
          );
          if (blockContent) {
            // Already has import block, just update
            var newContent = itemFileContent.replace(blockContent[0], newBlock);
          }
          else {
            // Doesn't have import block, prepend file content
            var newContent = newBlock + mainContent;
          }
        }
        fs.writeFileSync(itemFile, newContent);
      }
    }
  }
}

function constructName(folder, name) {
  if (name.startsWith('_')) {
    const parent = path.basename(path.dirname(folder));
    const newFolder = path.dirname(folder);
    const newName = parent + name;
    return constructName(newFolder, newName);
  }
  else {
    return name;
  }
}

function arrayToString(array, prepend='', append='') {
  const newArray = [];
  array.forEach(value => {
    if (value) {
      newArray.push(prepend + value + append);
    }
  });
  return newArray.join('');
}

module.exports = Generator;