// Generators for AssetsGenerationPlugin

const path = require('path');
const fs = require('fs');
const lex = require('pug-lexer');
const parse = require('pug-parser');
const walk = require('pug-walk');

/*
Global rules for file types:

message - string of warning message about file generation
add - function generating strings for file
*/
const rules = {
  '.js': {
    message: '// File generated automatically.\n// Any changes will be discarded during next compilation.\n\n',
    addBem: function(depFile, blockFile) {
      return `import '${path.relative(path.dirname(blockFile), depFile).replace(/\\/g, '/')}';\n`;
    },
    addExtends: function(extends_) {
      return `import '${extends_.replace(/$pug/, 'js')}';\n`;
    }
  },
  '.scss': {
    message: '// File generated automatically.\n// Any changes will be discarded during next compilation.\n\n',
    addBem: function(depFile, blockFile) {
      return `@import '${path.relative(path.dirname(blockFile), depFile).replace(/\\/g, '/')}';\n`;
    },
    addExtends: function(extends_) {
      return `@import '${extends_.replace(/$pug/, 'scss')}';\n`;
    }
  },
  '.pug': {
    message: '//- File generated automatically.\n//- Any changes will be discarded during next compilation.\n\n',
    addBem: function(depFile, blockFile) {
      return `include '${path.relative(path.dirname(blockFile), depFile).replace(/\\/g, '/')}';\n`;
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
        blocks[name][fileType] = entityPath;
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
  const items = pages || blocks;
  for (block of Object.entries(items)){
    const [blockName, blockFiles] = block;
    const dependencyFiles = {'.pug': [], '.scss': [], '.js': []};
    if (blockFiles['.pug']) {
      const ast = getAst(blockFiles['.pug']);
      const bems = getBems(ast);
      bems.bems.forEach(bem => {
        if (blocks[bem]) {
          for (file of Object.entries(blocks[bem])) {
            const [ext, filePath] = file;
            if (ext in dependencyFiles) {
              dependencyFiles[ext].push(filePath);
            }
          }
        }
      });
      writeDependencyFiles(blockFiles, dependencyFiles, bems.extends_);
    }
  }
}

function writeDependencyFiles(blockFiles, dependencyFiles, extends_) {
  for (blockFile of Object.entries(blockFiles)) {
    const [ext, filePath] = blockFile;
    if (dependencyFiles[ext] && dependencyFiles[ext].length) {
      const dependencyPath = path.join(path.dirname(filePath), 'dependencies' + ext);
      let content = rules[ext].message;
      dependencyFiles[ext].forEach(depFile => {
        content += rules[ext].addBem(depFile, filePath);
      });
      if (extends_) {
        content += rules[ext].addExtends(extends_);
      }
      fs.writeFileSync(dependencyPath, content);
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
  addBlocksDependencies(blocks);

  if (pagesFolders) {
    pagesFolders.forEach(folder => {
      const pages = getBlocks(folder);
      addBlocksDependencies(blocks, pages);
    });
  }
}

module.exports = generate;