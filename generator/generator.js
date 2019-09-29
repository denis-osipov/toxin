// Functions for dependencies generation

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const getBems = require('./get-bems');
const { symmetricDifference, union, intersection, difference } = require('./utils');
const { warningMessage, rules } = require('./rules');

class Generator {
  constructor(folders, inject, create) {
    this.folders = folders;
    this.inject = inject;
    this.create = create;
  }

  // Generate dependency files
  generate() {
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

    if (this.repeat) {
      this.generate();
    }
  }

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
            const content = getBems(
              pugFile.path,
              path.basename(pugFile.path, '.pug')
            );
            this.deps[itemName].content = [...content.bems];
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
      // Check if dependencies files list was changed
      changedExts = union(changedExts, (symmetricDifference(
        Object.keys(this.files[depName].files),
        Object.keys(this.prevFiles[depName].files)
      )));
    });
    return changedExts;
  }

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

  writeDependencyFiles(itemName, dependencyFiles) {
    const extendsFiles = this.deps[itemName].extends_ ?
      this.files[this.deps[itemName].extends_].files :
      null;
    Object.entries(this.files[itemName].files).forEach(itemFile => {
      const [ext, fileInfo] = itemFile;
      if (dependencyFiles[ext]) {
        const dependencyPath = path.join(path.dirname(fileInfo.path), 'dependencies' + ext);
        const message = warningMessage.join(rules[ext].commentStart);
        let imports = '';
        if (extendsFiles && extendsFiles[ext]) {
          imports += rules[ext].addBem(extendsFiles[ext].path, fileInfo.path, true);
        }
        dependencyFiles[ext].forEach(depFile => {
          imports += rules[ext].addBem(depFile, fileInfo.path);
        });
        if (imports) {
          fs.writeFileSync(dependencyPath, message + imports);
          this.depsFiles.toAdd[fileInfo.path] = dependencyPath;
          fileInfo.depFile = dependencyPath;
          this.injectImports(fileInfo.path, dependencyPath);
        }
        else {
          this.depsFiles.toRemove[fileInfo.path] = dependencyPath;
          if (fileInfo.depFile) {
            fs.unlinkSync(dependencyPath);
            delete fileInfo.depFile;
          }
          this.injectImports(fileInfo.path, dependencyPath, false);
        }
      }
    });
  }

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

  injectImports(itemFile, depFile, add = true) {
    const itemFileContent = fs.readFileSync(itemFile, { encoding: 'utf-8' });
    const ext = path.extname(itemFile);
    const importString = rules[ext].addBem(depFile, itemFile);
    if (add && !itemFileContent.includes(importString)) {
      // Special case for pug extends. Include can't be injected elsewhere except block
      // (or mixin)
      if (ext === '.pug' && itemFileContent.match(/^extends .+\s+/m)) {
        const firstBlock = itemFileContent.match(/^block .+(\s+)/m);
        const splittedContent = itemFileContent.split(firstBlock[0]);
        splittedContent.splice(1, 0, firstBlock[0], importString, firstBlock[1]);
        var newContent = splittedContent.join('');
      }
      else {
        var newContent = importString + itemFileContent;
      }
      fs.writeFileSync(itemFile, newContent);
    }
    else if (!add && itemFileContent.includes(importString)) {
      const newContent = itemFileContent.replace(importString, '');
      if (!newContent.match(/\S/)) {
        fs.unlinkSync(itemFile);
        this.repeat = true;
      }
      else {
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

module.exports = Generator;