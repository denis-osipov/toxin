// Functions for dependencies generation

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const getBems = require('./pug-helpers');
const { difference, symmetricDifference, union, intersection } = require('./utils');
const { warningMessage, rules } = require('./rules');

const eol = require('os').EOL;

function checkDependencies(files, prevFiles, depItems) {
  let changedExts = new Set();
  depItems.forEach(depName => {
    // Check if dependencies files list was changed
    changedExts = union(changedExts, (symmetricDifference(
      Object.keys(files[depName].files),
      Object.keys(prevFiles[depName].files)
    )));
  });
  return changedExts;
}

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

function createDependencies(itemName, files, prevFiles, depItems, prevDeps, extends_) {
  const deps = {};
  let changedExts = Object.keys(rules);
  if (prevFiles) {
    const allPrevDeps = union(prevDeps[itemName].folder, prevDeps[itemName].content);
    deps.changedDeps = symmetricDifference(depItems, allPrevDeps);
    deps.unchangedDeps = intersection(depItems, allPrevDeps);
    changedExts = checkDependencies(files, prevFiles, deps.unchangedDeps);
    deps.changedDeps.forEach(depName => {
      changedExts = Array.from(union(changedExts, Object.keys(files[depName].files)));
    });
  }
  const dependencyFiles = getDependencyFiles(depItems, files, changedExts);
  const extendsFile = extends_ ? files[extends_].files : null;
  return writeDependencyFiles(files[itemName].files, dependencyFiles, extendsFile);
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

    this.folders.forEach(folder => scanFolder(folder));

    // Don't regenerate if files weren't changed
    if (!(this.prevFiles && _.isEqual(this.files, this.prevFiles))) {
      addDependencies(this.files, this.prevFiles, this.prevDeps);
    }
    else {
      this.depsFiles = null;
    }
  }

  scanFolder(root, parent) {
    const entities = fs.readdirSync(root, { encoding: 'utf-8', withFileTypes: true });
    entities.forEach(entity => {
      const entityPath = path.join(root, entity.name);
      if (entity.isDirectory()) {
        // Directory name is BEM entity name
        const name = constructName(entityPath, entity.name);
        this.files[name] = {
          files: {},
          folderDependencies: []
        };
        // If current directory isn't one of top-level, it is element or modifier directory.
        // Fdd it to parent dependencies.
        if (parent) {
          this.files[parent].folderDependencies.push(name);
        }
        scanFolder(entityPath, name);
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
      let depItems;
  
      if (this.prevFiles && _.isEqual(itemInfo, this.prevFiles[itemName])) {
        // If entity wasn't changed, use previous dependencies
        this.deps[itemName] = this.prevDeps[itemName];
        depItems = union(this.deps[itemName].folder, this.deps[itemName].content.filter(bem => bem in this.files));
        const extends_ = this.deps[itemName].extends_;
        const deps = createDependencies(itemName, this.files, this.prevFiles, depItems, this.prevDeps, extends_);
        Object.assign(this.depsFiles.toAdd, deps.toAdd);
        Object.assign(this.depsFiles.toRemove, deps.toRemove);
      }
      else {
        // Block was changed
        this.deps[itemName].folder = itemInfo.folderDependencies;
        if (!(this.prevFiles && _.isEqual(itemInfo.files['.pug'], this.prevFiles[itemName].files['.pug']))) {
          // First generation or template was changed, so parse pug
          if (itemInfo.files['.pug']) {
            const content = getBems(itemInfo.files['.pug'].path, path.basename(itemInfo.files['.pug'].path, '.pug'));
            this.deps[itemName].content = [...content.bems];
            depItems = union(itemInfo.folderDependencies, this.deps[itemName].content.filter(bem => bem in this.files));
            this.deps[itemName].extends_ = content.extends_;
          }
          else {
            depItems = itemInfo.folderDependencies;
          }
        }
        else {
          // If pug file wasn't changed, use previous content and extends dependencies
          this.deps[itemName].content = this.prevDeps[itemName].content;
          depItems = union(itemInfo.folderDependencies, this.prevDeps[itemName].content.filter(bem => bem in this.files));
          this.deps[itemName].extends_ = this.prevDeps[itemName].extends_;
        }
  
        const extends_ = this.deps[itemName].extends_;
        const deps = createDependencies(itemName, this.files, this.prevFiles, depItems, this.prevDeps, extends_);
        Object.assign(this.depsFiles.toAdd, deps.toAdd);
        Object.assign(this.depsFiles.toRemove, deps.toRemove);
      }
    });
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