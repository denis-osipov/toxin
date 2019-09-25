// Functions for dependencies generation

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const getBems = require('./pug-helpers');
const { difference, symmetricDifference, union, intersection } = require('./utils');
const { warningMessage, rules } = require('./rules');

const eol = require('os').EOL;

function getDependencyFiles(depItems, files, extensions) {
  const dependencyFiles = {};
  extensions.forEach(ext => {
    dependencyFiles[ext] = [];
  });
  depItems.forEach(depItem => {
    if (files[depItem]) {
      // Add only existing files
      for (file of Object.entries(files[depItem].files)) {
        const [ext, fileInfo] = file;
        if (ext in dependencyFiles) {
          dependencyFiles[ext].push(fileInfo.path);
        }
      }
    }
  });
  return dependencyFiles;
}

function writeDependencyFiles(itemFiles, dependencyFiles, extendsFiles) {
  const depsFileList = { toAdd: {}, toRemove: {} };
  for (itemFile of Object.entries(itemFiles)) {
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
        depsFileList.toAdd[fileInfo.path] = dependencyPath;
        fileInfo.depFile = dependencyPath;
      }
      else {
        depsFileList.toRemove[fileInfo.path] = dependencyPath;
        if (fileInfo.depFile) {
          fs.unlinkSync(dependencyPath);
          delete fileInfo.depFile;
        }
      }
    }
  }
  return depsFileList;
}

function inject(depFiles) {
  for (files of Object.entries(depFiles.toAdd)) {
    const [itemFile, depFile] = files;
    const itemFileContent = fs.readFileSync(itemFile, {encoding: 'utf-8'});
    const ext = path.extname(itemFile);
    const importString = rules[ext].addBem(depFile, itemFile);
    if (!itemFileContent.includes(importString.trim())) {
      let newContent;
      // Special case for pug extends. Include can't be injected elsewhere except block
      // (or mixin)
      if (ext === '.pug' && itemFileContent.match(/^extends .+\s+/m)) {
          const firstBlock = itemFileContent.match(/^block .+(\s+)/m);
          const splittedContent = itemFileContent.split(firstBlock[0]);
          splittedContent.splice(1, 0, firstBlock[0], importString, firstBlock[1]);
          newContent = splittedContent.join('');
        }
      else {
        newContent = importString + itemFileContent;
      }
      fs.writeFileSync(itemFile, newContent);
    }
  }
  for (files of Object.entries(depFiles.toRemove)) {
    const [itemFile, depFile] = files;
    const itemFileContent = fs.readFileSync(itemFile, {encoding: 'utf-8'});
    const ext = path.extname(itemFile);
    const importString = rules[ext].addBem(depFile, itemFile);
    if (itemFileContent.includes(importString.trim())) {
      const newContent = itemFileContent.replace(importString, '');
      fs.writeFileSync(itemFile, newContent);
    }
  }
}

class Generator {
  constructor(folders, inject) {
    this.folders = folders;
    this.inject = inject;
  }

  // Generate dependency files
  generate() {
    this.prevFiles = this.files;
    this.prevDeps = this.deps;
    this.files = {};

    this.folders.forEach(folder => this.scanFolder(folder));

    // Don't regenerate if files weren't changed
    if (!(this.prevFiles && _.isEqual(this.files, this.prevFiles))) {
      this.addDependencies(this.files, this.prevFiles, this.prevDeps);
    }
    else {
      this.depsFiles = null;
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
        const name = path.basename(entity.name, fileType);
        if (name !== 'dependencies') {
          this.files[name].files[fileType] = Object.assign(
            this.files[parent].files[fileType] || {},
            {path: entityPath, mtime: fs.statSync(entityPath).mtimeMs}
          );
        }
        else {
          this.files[parent].files[fileType] = Object.assign(
            this.files[parent].files[fileType] || {},
            {depFile: entityPath}
          );
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
        const deps = createDependencies(itemName);
        Object.assign(this.depsFiles.toAdd, deps.toAdd);
        Object.assign(this.depsFiles.toRemove, deps.toRemove);
      }
      else {
        // Block was changed
        this.deps[itemName].folder = itemInfo.folderDependencies;
        const pugFile = itemInfo.files['.pug'];
        if (!(
          this.prevFiles &&
          _.isEqual(pugFile, this.prevFiles[itemName].files['.pug'])
          )) {
          // First generation or template was changed, so parse pug
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

        const deps = createDependencies(itemName);
        Object.assign(this.depsFiles.toAdd, deps.toAdd);
        Object.assign(this.depsFiles.toRemove, deps.toRemove);
      }
    });
  }

  createDependencies(itemName) {
    const existingDeps = this.deps[itemName].content ?
      this.deps[itemName].content.filter(bem => bem in this.files) :
      [];
    const depItems = union(this.deps[itemName].folder, existingDeps);
    let changedExts;
    if (this.prevFiles) {
      const deps = {};
      const prevExistingDeps = this.prevDeps[itemName].content ?
        this.prevDeps[itemName].content.filter(bem => bem in this.prevFiles) :
        [];
      const allPrevExistingDeps = union(
        this.prevDeps[itemName].folder,
        prevExistingDeps
      );
      deps.changedDeps = symmetricDifference(depItems, allPrevExistingDeps);
      deps.unchangedDeps = intersection(depItems, allPrevExistingDeps);
      changedExts = checkDependencies(deps.unchangedDeps);
      deps.changedDeps.forEach(depName => {
        changedExts = union(
          changedExts,
          Object.keys(this.files[depName].files)
        );
      });
    }
    else {
      changedExts = Object.keys(rules);
    }
    const dependencyFiles = getDependencyFiles(depItems, this.files, changedExts);
    const extendsFile = this.deps[itemName].extends_ ? this.files[extends_].files : null;
    return writeDependencyFiles(this.files[itemName].files, dependencyFiles, extendsFile);
  }

  checkDependencies(deps) {
    let changedExts = new Set();
    deps.forEach(depName => {
      // Check if dependencies files list was changed
      changedExts = union(changedExts, (symmetricDifference(
        Object.keys(this.files[depName].files),
        Object.keys(this.prevFiles[depName].files)
      )));
    });
    return changedExts;
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