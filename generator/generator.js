// Generators for AssetsGenerationPlugin

const path = require('path');
const fs = require('fs');
const lex = require('pug-lexer');
const parse = require('pug-parser');
const walk = require('pug-walk');

/*
Global rules for file types:

warningMessage - array of strings for warning message about file generation
addBem - function generating import strings for regular blocks
addExtends - function generating import strings for pug extends
*/
const eol = require('os').EOL;
const warningMessage = [
  '',
  `File generated automatically.${eol}`,
  `Any changes will be discarded during next compilation.${eol}${eol}`
];

const rules = {
  '.js': {
    commentStart: '// ',
    addBem: function(depFile, blockFile) {
      let importPath = path.relative(path.dirname(blockFile), depFile).replace(/\\/g, '/');
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
    addBem: function(depFile, blockFile) {
      return `@import '${path.relative(path.dirname(blockFile), depFile).replace(/\\/g, '/')}';${eol}`;
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
    addBem: function(depFile, blockFile) {
      return `include ${path.relative(path.dirname(blockFile), depFile).replace(/\\/g, '/')}${eol}`;
    },
    addExtends: function(extends_) {
      return '';
    }
  }
};


function getBemFiles(path) {
  const blocks = {};
  scanFolder(path, blocks);
  return blocks;
}

function scanFolder(root, blocks, parent) {
  const entities = fs.readdirSync(root, { encoding: 'utf-8', withFileTypes: true });
  entities.forEach(function(entity) {
    const entityPath = path.join(root, entity.name);
    if (entity.isDirectory()) {
      const name = constructName(entityPath, entity.name);
      blocks[name] = {
        files: {},
        internalDependencies: []
      };
      if (parent) {
        blocks[parent].internalDependencies.push(name);
      }
      scanFolder(entityPath, blocks, name);
    }
    else if (entity.isFile()) {
      const fileType = path.extname(entity.name);
      const name = path.basename(entity.name, fileType);
      if (name !== 'dependencies') {
        blocks[name].files[fileType] = {path: entityPath, mtime: fs.statSync(entityPath).mtimeMs};
      }
      else {
        blocks[parent].files[fileType] = Object.assign(
          blocks[parent].files[fileType] || {},
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

function addBlocksDependencies(blocks, pages, prevFiles) {
  const depFiles = {};
  const items = pages || blocks;
  for (block of Object.entries(items)){
    const [blockName, blockInfo] = block;
    const dependencyFiles = {'.pug': [], '.scss': [], '.js': []};
    const depBlocks = new Set(blockInfo.internalDependencies);
    let extends_;
    if (blockInfo.files['.pug']) {
      const ast = getAst(blockInfo.files['.pug'].path);
      const bems = getBems(ast, path.basename(blockInfo.files['.pug'].path, '.pug'));
      bems.bems.forEach(bem => {
        depBlocks.add(bem);
      })
      extends_ = bems.extends_;
    }
    depBlocks.forEach(depBlock => {
      if (blocks[depBlock]) {
        for (file of Object.entries(blocks[depBlock].files)) {
          const [ext, fileInfo] = file;
          if (ext in dependencyFiles) {
            dependencyFiles[ext].push(fileInfo.path);
          }
        }
      }
    });
    Object.assign(depFiles, writeDependencyFiles(blockInfo, dependencyFiles, extends_));
  }
  return depFiles;
}

function writeDependencyFiles(blockInfo, dependencyFiles, extends_) {
  const depFiles = {};
  for (blockFile of Object.entries(blockInfo.files)) {
    const [ext, fileInfo] = blockFile;
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
      depFiles[fileInfo.path] = dependencyPath;
    }
  }
  return depFiles;
}

function inject(depFiles) {
  for (files of Object.entries(depFiles)) {
    const [blockFile, depFile] = files;
    const blockContent = fs.readFileSync(blockFile, {encoding: 'utf-8'});
    const ext = path.extname(blockFile);
    const importString = rules[ext].addBem(depFile, blockFile);
    if (!blockContent.includes(importString.trim())) {
      let newContent;
      if (ext === '.pug' && blockContent.match(/^extends .+\s+/m)) {
          const firstBlock = blockContent.match(/^block .+(\s+)/m);
          const splittedContent = blockContent.split(firstBlock[0]);
          splittedContent.splice(1, 0, firstBlock[0], importString, firstBlock[1]);
          newContent = splittedContent.join('');
        }
      else {
        newContent = importString + blockContent;
      }
      fs.writeFileSync(blockFile, newContent);
    }
  }
}

// Get BEM list from pug file.
// BEM entities should be added as mixins or as block classes.
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
function generate(bemsFolder, pagesFolders, prevEntities, prevDeps) {
  const bemsFiles = getBemFiles(bemsFolder);
  const depsFiles = prevDeps || {};
  Object.assign(depsFiles, addBlocksDependencies(bemsFiles, null, prevEntities));

  const pagesFiles = {};
  if (pagesFolders) {
    pagesFolders.forEach(folder => {
      const pageFiles = getBemFiles(folder);
      Object.assign(pagesFiles, pageFiles);
      Object.assign(depsFiles, addBlocksDependencies(bemsFiles, pageFiles, prevEntities));
    });
  }

  return {
    entitiesFiles: Object.assign(bemsFiles, pagesFiles),
    depsFiles: depsFiles
  };
}

module.exports = { generate, inject };