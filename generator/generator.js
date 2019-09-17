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
      return `import '${path.relative(path.dirname(blockFile), depFile).replace(/\\/g, '/')}';${eol}`;
    },
    addExtends: function(extends_) {
      return `import '${extends_.replace(/.pug$/, '')}';${eol}`;
    }
  },
  '.scss': {
    commentStart: '// ',
    addBem: function(depFile, blockFile) {
      return `@import '${path.relative(path.dirname(blockFile), depFile).replace(/\\/g, '/')}';${eol}`;
    },
    addExtends: function(extends_) {
      return `@import '${extends_.replace(/.pug$/, '')}';${eol}`;
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


function getBlocks(path) {
  const blocks = {};
  scanFolder(path, blocks);
  return blocks;
}

function scanFolder(root, blocks) {
  const entities = fs.readdirSync(root, { encoding: 'utf-8', withFileTypes: true });
  entities.forEach(function(entity) {
    const entityPath = path.join(root, entity.name);
    if (entity.isDirectory()) {
      const name = constructName(entityPath, entity.name);
      blocks[name] = {};
      scanFolder(entityPath, blocks);
    }
    else if (entity.isFile()) {
      const fileType = path.extname(entity.name);
      const name = path.basename(entity.name, fileType);
      if (name !== 'dependencies') {
        blocks[name][fileType] = {path: entityPath, mtime: fs.statSync(entityPath).mtimeMs};
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

function addBlocksDependencies(blocks, pages) {
  const depFiles = {};
  const items = pages || blocks;
  for (block of Object.entries(items)){
    const [blockName, blockFiles] = block;
    const dependencyFiles = {'.pug': [], '.scss': [], '.js': []};
    if (blockFiles['.pug']) {
      const ast = getAst(blockFiles['.pug'].path);
      const bems = getBems(ast);
      bems.bems.forEach(bem => {
        if (blocks[bem]) {
          for (file of Object.entries(blocks[bem])) {
            const [ext, fileInfo] = file;
            if (ext in dependencyFiles) {
              dependencyFiles[ext].push(fileInfo.path);
            }
          }
        }
      });
      Object.assign(depFiles, writeDependencyFiles(blockFiles, dependencyFiles, bems.extends_));
    }
  }
  return depFiles;
}

function writeDependencyFiles(blockFiles, dependencyFiles, extends_) {
  const depFiles = {};
  for (blockFile of Object.entries(blockFiles)) {
    const [ext, fileInfo] = blockFile;
    if (dependencyFiles[ext] && dependencyFiles[ext].length) {
      const dependencyPath = path.join(path.dirname(fileInfo.path), 'dependencies' + ext);
      let content = warningMessage.join(rules[ext].commentStart);
      dependencyFiles[ext].forEach(depFile => {
        content += rules[ext].addBem(depFile, fileInfo.path);
      });
      if (extends_) {
        content += rules[ext].addExtends(extends_);
      }
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
function getBems(ast) {
  let bems = new Set();
  let extends_;
  walk(ast, function before(node, replace) {
    if (node.type === 'Include') {
      return false;
    }
    else if (node.type === 'Mixin') {
      if (node.call) {
        bems.add(node.name);
      }
      if (node.attrs) {
        node.attrs.forEach(attr => {
          if (attr.name === 'class') {
            const classes = attr.val.split(' ');
            classes.forEach(class_ => {
              const bemClass = class_.replace(/['"]/g, '');
              if (bemClass !== node.name) {
                bems.add(bemClass);
              }
            });
          }
        });
      }
    }
    else if (node.type === 'Extends') {
      extends_ = node.file.path;
    }
  }, {
    includeDependencies: true
  });

  return { bems: Array.from(bems), extends_: extends_ };
}

function getAst(file) {
  const str = fs.readFileSync(file, {encoding: 'utf-8'});
  const tokens = lex(str);
  return parse(tokens);
}

// Generate dependency files
function generate(blocksFolder, pagesFolders) {
  const blocks = getBlocks(blocksFolder);
  const depFiles = addBlocksDependencies(blocks);

  const pageBlocks = {};
  if (pagesFolders) {
    pagesFolders.forEach(folder => {
      const pages = getBlocks(folder);
      pageBlocks[folder] = pages;
      Object.assign(depFiles, addBlocksDependencies(blocks, pages));
    });
  }

  return {
    blocks: blocks,
    pages: pageBlocks,
    depFiles: depFiles
  };
}

module.exports = { generate, inject };