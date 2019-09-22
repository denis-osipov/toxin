// Functions for dependencies generation

const path = require('path');
const fs = require('fs');
const lex = require('pug-lexer');
const parse = require('pug-parser');
const walk = require('pug-walk');
const _ = require('lodash');

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
    },
    addExtends: function(extends_, pageFile) {
      const otherFile = extends_.replace(/.pug$/, '.js');
      if (fs.existsSync(path.resolve(path.dirname(pageFile), otherFile))) {
        if (!otherFile.match(/^\.{0,2}\//)) {
          otherFile = './' + otherFile;
        }
        return `import '${otherFile}';${eol}`;
      }
      return '';
    }
  },
  '.scss': {
    commentStart: '// ',
    addBem: function(depFile, entityFile) {
      return `@import '${path.relative(path.dirname(entityFile), depFile).replace(/\\/g, '/')}';${eol}`;
    },
    addExtends: function(extends_, pageFile) {
      const otherFile = extends_.replace(/.pug$/, '.scss');
      if (fs.existsSync(path.resolve(path.dirname(pageFile), otherFile))) {
        return `@import '${otherFile}';${eol}`;
      }
      return '';
    }
  },
  '.pug': {
    commentStart: '//- ',
    addBem: function(depFile, entityFile) {
      return `include ${path.relative(path.dirname(entityFile), depFile).replace(/\\/g, '/')}${eol}`;
    },
    addExtends: function(extends_) {
      return '';
    }
  }
};


function getBemFiles(path) {
  const bems = {};
  scanFolder(path, bems);
  return bems;
}

function scanFolder(root, bems, parent) {
  const entities = fs.readdirSync(root, { encoding: 'utf-8', withFileTypes: true });
  entities.forEach(function(entity) {
    const entityPath = path.join(root, entity.name);
    if (entity.isDirectory()) {
      // Directory name is BEM entity name
      const name = constructName(entityPath, entity.name);
      bems[name] = {
        files: {},
        internalDependencies: []
      };
      // If current directory isn't one of top-level, it is element or modifier directory.
      // Fdd it to parent dependencies.
      if (parent) {
        bems[parent].internalDependencies.push(name);
      }
      scanFolder(entityPath, bems, name);
    }
    else if (entity.isFile()) {
      // If it's a file, add it to info for corresponding BEM entity
      const fileType = path.extname(entity.name);
      const name = path.basename(entity.name, fileType);
      if (name !== 'dependencies') {
        bems[name].files[fileType] = {path: entityPath, mtime: fs.statSync(entityPath).mtimeMs};
      }
      else {
        bems[parent].files[fileType] = Object.assign(
          bems[parent].files[fileType] || {},
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

function addDependencies(files, prevFiles, prevDeps) {
  const depsEntityList = {};
  const depsFileList = {};
  for (item of Object.entries(files)){
    const [itemName, itemInfo] = item;

    // if (_.isEqual(itemInfo, prevFiles[itemName])) {
    //   // If entity wasn't changed, check if dependencies were changed
    //   let changedFiles = new Set();
    //   prevDeps[itemName].forEach(depName => {
    //     changedFiles.add(symmetricDifference(
    //       Object.keys(bemsFiles[depName].files),
    //       Object.keys(previousBemsFiles[depName].files)
    //     ));
    //   });
    //   changedFiles.forEach(ext => {
    //     // Regenerate dependencies for each extension
    //   })
    // }

    const dependencyFiles = {'.pug': [], '.scss': [], '.js': []};
    const depItems = new Set(itemInfo.internalDependencies);
    let extends_;
    // If BEM entity is implemented in pug, parse pug file
    if (itemInfo.files['.pug']) {
      const ast = getAst(itemInfo.files['.pug'].path);
      const bems = getBems(ast, path.basename(itemInfo.files['.pug'].path, '.pug'));
      bems.bems.forEach(bem => {
        depItems.add(bem);
      })
      extends_ = bems.extends_;
    }
    // Add internal and external dependencies to object
    depItems.forEach(depItem => {
      if (bems[depItem]) {
        // Add only existing files
        for (file of Object.entries(bems[depItem].files)) {
          const [ext, fileInfo] = file;
          if (ext in dependencyFiles) {
            dependencyFiles[ext].push(fileInfo.path);
          }
        }
      }
    });
    Object.assign(depsFileList, writeDependencyFiles(itemInfo, dependencyFiles, extends_));
  }
  return { depsEntityList: depsEntityList, depsFileList: depsFileList };
}

function writeDependencyFiles(itemInfo, dependencyFiles, extends_) {
  const depsFileList = {};
  for (itemFile of Object.entries(itemInfo.files)) {
    const [ext, fileInfo] = itemFile;
    if (dependencyFiles[ext] && dependencyFiles[ext].length) {
      const dependencyPath = path.join(path.dirname(fileInfo.path), 'dependencies' + ext);
      let content = warningMessage.join(rules[ext].commentStart);
      if (extends_) {
        content += rules[ext].addExtends(extends_, fileInfo.path);
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
        newContent = importString + blockContent;
      }
      fs.writeFileSync(itemFile, newContent);
    }
  }
}

// Get BEM list from pug file.
// BEM entities should be added as mixins or as classes.
function getBems(ast, blockName) {
  let bems = new Set();
  let extends_;
  walk(ast, function before(node, replace) {
    if (node.type === 'Include') {
      return false;
    }
    else if (node.type === 'Mixin' && node.call) {
      bems.add(node.name);
    }
    else if (node.type === 'Extends') {
      extends_ = node.file.path;
    }

    if (node.attrs) {
      node.attrs.forEach(attr => {
        if (attr.name === 'class') {
          const classes = attr.val.split(' ');
          classes.forEach(class_ => {
            const bemClass = class_.replace(/['"]/g, '');
            if (bemClass !== blockName) {
              bems.add(bemClass);
            }
          });
        }
      });
    }
  });

  return { bems: bems, extends_: extends_ };
}

function getAst(file) {
  const str = fs.readFileSync(file, {encoding: 'utf-8'});
  const tokens = lex(str);
  return parse(tokens);
}

// Generate dependency files
function generate(folders, prevFiles, prevDeps) {
  const files = {};
  folders.forEach(folder => {
    Object.assign(files, getBemFiles(folder));
  });

  // Don't regenerate if files weren't changed
  if (!(prevFiles && _.isEqual(files, prevFiles))) {
    const { depsBems, depsFiles } = addDependencies(
      files,
      prevFiles || {},
      prevDeps || {}
      );
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