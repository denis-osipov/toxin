// Functions for dependencies generation

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const getBems = require('./pug-helpers');
const { difference, symmetricDifference, union } = require('./utils');

const eol = require('os').EOL;

/*
Global rules for file types:

warningMessage - array of strings for warning message about file generation
addBem - function generating import strings for regular BEM entities
addExtends - function generating import strings for pug extends
*/
const warningMessage = [
  '',
  `File generated automatically.${eol}`,
  `Any changes will be discarded during next compilation.${eol}${eol}`
];

const rules = {
  '.js': {
    commentStart: '// ',
    addBem: function(depFile, entityFile) {
      let importPath = path.relative(path.dirname(entityFile), depFile).replace(/\\/g, '/');
      if (!importPath.match(/^\.{0,2}\//)) {
        importPath = './' + importPath;
      }
      return `import '${importPath}';${eol}`;
    }
  },
  '.scss': {
    commentStart: '// ',
    addBem: function(depFile, entityFile) {
      return `@import '${path.relative(path.dirname(entityFile), depFile).replace(/\\/g, '/')}';${eol}`;
    }
  },
  '.pug': {
    commentStart: '//- ',
    addBem: function(depFile, entityFile, isExtends) {
      if (isExtends) {
        // Extended file is already included
        return '';
      }
      return `include ${path.relative(path.dirname(entityFile), depFile).replace(/\\/g, '/')}${eol}`;
    }
  }
};


function getBemFiles(path) {
  const files = {};
  scanFolder(path, files);
  return files;
}

function scanFolder(root, files, parent) {
  const entities = fs.readdirSync(root, { encoding: 'utf-8', withFileTypes: true });
  entities.forEach(function(entity) {
    const entityPath = path.join(root, entity.name);
    if (entity.isDirectory()) {
      // Directory name is BEM entity name
      const name = constructName(entityPath, entity.name);
      files[name] = {
        files: {},
        folderDependencies: []
      };
      // If current directory isn't one of top-level, it is element or modifier directory.
      // Fdd it to parent dependencies.
      if (parent) {
        files[parent].folderDependencies.push(name);
      }
      scanFolder(entityPath, files, name);
    }
    else if (entity.isFile()) {
      // If it's a file, add it to info for corresponding BEM entity
      const fileType = path.extname(entity.name);
      const name = path.basename(entity.name, fileType);
      if (name !== 'dependencies') {
        files[name].files[fileType] = {path: entityPath, mtime: fs.statSync(entityPath).mtimeMs};
      }
      else {
        files[parent].files[fileType] = Object.assign(
          files[parent].files[fileType] || {},
          {depFile: entityPath}
        )
      }
    }
  });
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

function checkDependencies(files, prevFiles, depItems) {
  let changedFiles = new Set();
  depItems.forEach(depName => {
    // Check if dependencies files list was changed
    changedFiles.add(symmetricDifference(
      Object.keys(files[depName].files),
      Object.keys(prevFiles[depName].files)
    ));
  });
  return changedFiles;
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

function createDependencies(itemInfo, files, prevFiles, depItems, extends_) {
  const changedFiles = prevFiles ? checkDependencies(files, prevFiles, depItems) : Object.keys(rules);
  const dependencyFiles = getDependencyFiles(depItems, files, changedFiles);
  const extendsFile = extends_ ? files[extends_].files : null;
  return writeDependencyFiles(itemInfo.files, dependencyFiles, extendsFile);
}

function addDependencies(files, prevFiles, prevDeps) {
  const depsBems = {};
  const depsFiles = {};
  for (item of Object.entries(files)){
    const [itemName, itemInfo] = item;
    depsBems[itemName] = {};
    let depItems;

    if (prevFiles && _.isEqual(itemInfo, prevFiles[itemName])) {
      // If entity wasn't changed, check if its dependencies were changed
      depItems = union(prevDeps.folder, prevDeps.content);
      const extends_ = prevDeps[itemName].extends_;
      Object.assign(depsFiles, createDependencies(itemInfo, files, prevFiles, depItems, extends_));
    }
    else {
      // Block was changed
      depsBems[itemName].folder = itemInfo.folderDependencies;
      if (!(prevFiles && _.isEqual(itemInfo.files['.pug'], prevFiles[itemName].files['.pug']))) {
        // First generation or template was changed, so parse pug
        if (itemInfo.files['.pug']) {
          const content = getBems(itemInfo.files['.pug'].path, path.basename(itemInfo.files['.pug'].path, '.pug'));
          depsBems[itemName].content = content.bems;
          depItems = union(itemInfo.folderDependencies, content.bems);
          depsBems[itemName].extends_ = content.extends_;
        }
        else {
          depItems = itemInfo.folderDependencies;
        }
      }
      else {
        depsBems[itemName].content = prevDeps[itemName].content;
        depItems = union(itemInfo.folderDependencies, prevDeps[itemName].content);
        depsBems[itemName].extends_ = prevDeps[itemName].extends_;
      }

      if (
        prevDeps &&
        _.isEqual(depItems, union(prevDeps[itemName].folder, prevDeps[itemName].content)) &&
        depsBems[itemName].extends_ === prevDeps[itemName].extends_
       ) {
        // Check if dependencies file list were changed and regenerate for some extensions
        const extends_ = depsBems[itemName].extends_;
        Object.assign(depsFiles, createDependencies(itemInfo, files, prevFiles, depItems, extends_));
      }
      else {
        // Regenerate dependencies
        const extends_ = depsBems[itemName].extends_;
        Object.assign(depsFiles, createDependencies(itemInfo, files, prevFiles, depItems, extends_));
      }
    }
  }
  return { depsBems: depsBems, depsFiles: depsFiles };
}

function writeDependencyFiles(itemFiles, dependencyFiles, extendsFiles) {
  const depsFileList = {};
  for (itemFile of Object.entries(itemFiles)) {
    const [ext, fileInfo] = itemFile;
    if (dependencyFiles[ext] && dependencyFiles[ext].length) {
      const dependencyPath = path.join(path.dirname(fileInfo.path), 'dependencies' + ext);
      let content = warningMessage.join(rules[ext].commentStart);
      if (extendsFiles && extendsFiles[ext]) {
        content += rules[ext].addBem(extendsFiles[ext].path, fileInfo.path, true);
      }
      dependencyFiles[ext].forEach(depFile => {
        content += rules[ext].addBem(depFile, fileInfo.path);
      });
      fs.writeFileSync(dependencyPath, content);
      depsFileList[fileInfo.path] = dependencyPath;
    }
  }
  return depsFileList;
}

function inject(depFiles) {
  for (files of Object.entries(depFiles)) {
    const [itemFile, depFile] = files;
    const itemFileContent = fs.readFileSync(itemFile, {encoding: 'utf-8'});
    const ext = path.extname(itemFile);
    const importString = rules[ext].addBem(depFile, itemFile) + eol;
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
}

// Generate dependency files
function generate(folders, prevFiles, prevDeps) {
  const files = {};
  folders.forEach(folder => {
    Object.assign(files, getBemFiles(folder));
  });

  // Don't regenerate if files weren't changed
  if (!(prevFiles && _.isEqual(files, prevFiles))) {
    const { depsBems, depsFiles } = addDependencies(files, prevFiles, prevDeps);
    return {
      files: files,
      depsFiles: depsFiles,
      depsBems: depsBems
    };
  }

  return {
    files: prevFiles,
    depsFiles: {},
    depsBems: prevDeps
  };
}

module.exports = { generate, inject };