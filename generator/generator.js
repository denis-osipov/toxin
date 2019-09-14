// Generators for AssetsGenerationPlugin

const path = require('path');
const fs = require('fs');
const lex = require('pug-lexer');
const parse = require('pug-parser');
const load = require('pug-load');
const walk = require('pug-walk');

/*
Global rules for file types:

message - string of warning message about file generation
add - function generating strings for file
*/
const rules = {
  '.js': {
    message: '// File generated automatically.\n// Any changes will be discarded during next compilation.\n\n',
    add: function(depFile, blockFile) {
      return `import '${path.relative(path.dirname(blockFile), depFile).replace(/\\/g, '/')}';\n`;
    }
  },
  '.scss': {
    message: '// File generated automatically.\n// Any changes will be discarded during next compilation.\n\n',
    add: function(depFile, blockFile) {
      return `@import '${path.relative(path.dirname(blockFile), depFile).replace(/\\/g, '/')}';\n`;
    }
  },
  '.pug': {
    message: '//- File generated automatically.\n//- Any changes will be discarded during next compilation.\n\n',
    add: function(depFile, blockFile) {
      return `include '${path.relative(path.dirname(blockFile), depFile).replace(/\\/g, '/')}';\n`;
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
      blocks[name][fileType] = entityPath;
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

function addBlocksDependencies(blocks) {
  for (block of Object.entries(blocks)){
    const [blockName, blockFiles] = block;
    const dependencyFiles = {'.pug': [], '.scss': [], '.js': []};
    if (files['.pug']) {
      const ast = getAst(files['.pug']);
      const bems = getBems(ast);
      bems.forEach(bem => {
        if (blocks[bem]) {
          for (file of Object.entries(blocks[bem])) {
            const [ext, filePath] = file;
            dependencyFiles[ext].push(filePath);
          }
        }
      });
    }
    writeDependencyFiles(blockFiles, dependencyFiles);
  }
}

function writeDependencyFiles(blockFiles, dependencyFiles) {
  for (blockFile of Object.entries(blockFiles)) {
    const [ext, filePath] = blockFile;
    if (dependencyFiles[ext] && dependencyFiles[ext].length) {
      const dependencyPath = path.join(path.dirname(filePath), 'dependencies' + ext);
      let content = rules[ext].message;
      dependencyFiles[ext].forEach(depFile => {
        content += rules[ext].add(depFile, filePath);
      });
      fs.writeFileSync(dependencyPath, content);
    }
  }
}

// Get BEM list from pug file.
// BEM entities should be added as mixins or as block classes.
function getBems(ast) {
  let bems = new Set();
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
  }, {
    includeDependencies: true
  });

  return Array.from(bems);
}

function getAst(file) {
  return load.file(file, {
    lex: lex,
    parse: parse
  });
}

// Generate dependency files
function generate(path) {
  const blocks = getBlocks(path);
  addBlocksDependencies(blocks);
}

module.exports = generate;