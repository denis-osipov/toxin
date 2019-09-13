// Generators for AssetsGenerationPlugin

const path = require('path');
const fs = require('fs');
const pug = require('pug');
const lex = require('pug-lexer');
const parse = require('pug-parser');
const load = require('pug-load');
const walk = require('pug-walk');

/*
Global rules for file types:

message - string of warning message about file generation
prepend - array of strings to place at the beginning of file, before main content
append - array of strings to place at the end of file, after main content
use - function generating strings for file
*/
const rules = {
  js: {
    message: '// File generated automatically.\n// Any changes will be discarded during next compilation.\n\n',
    prepend: [],
    append: ['./page-script.js'],
    use: function(entityFile, entryFile) {
      return `import '${path.relative(path.dirname(entryFile), entityFile).replace(/\\/g, '/')}';\n`;
    },
    add: function(item) {
      return `import '${item}';\n`;
    }
  },
  scss: {
    message: '// File generated automatically.\n// Any changes will be discarded during next compilation.\n\n',
    prepend: [
      'variables',
      'fonts/fonts',
      'mixins'
    ],
    append: ['./page-style'],
    use: function(entityFile) {
      const entity = path.basename(entityFile, '.scss');
      return `@include ${entity};\n`;
    },
    add: function(item) {
      return `@import '${item}';\n`;
    }
  },
  pug: {
    message: '//- File generated automatically.\n//- Any changes will be discarded during next compilation.\n\n'
  }
};

// Generate entries files
function generateEntries(context, entry) {
  const blocksPath = path.join(context, 'blocks');
  for (point in entry) {

    // Get files paths for entry point
    const entryFiles = getFileList(entry[point], context);

    // Get list of used bem entities
    const templateFile = entryFiles[0].replace(/\.(js|scss)$/, '.pug');
    const blocks = getBemList(context, templateFile, 'ast');

    // Write files
    entryFiles.forEach(function(file) {
      const type = path.extname(file).slice(1);
      fs.writeFileSync(file, rules[type].message); // warning about autogeneration

      // Mandatory initial imports
      rules[type].prepend.forEach(function(item) {
        fs.appendFileSync(file, rules[type].add(item), 'utf-8');
      });

      // Add used bem entities
      blocks.bems.forEach(function(entity) {
        const entityFile = path.join(blocksPath, entity, entity + `.${type}`);
        if (fs.existsSync(entityFile)) {
          fs.appendFileSync(file, rules[type].use(entityFile, file), 'utf-8');
        }
      });

      // Add assets for extended template
      if (blocks.extends) {
        const assetName = blocks.extends.replace(/\.pug$/, `.${type}`);
        const assetPath = path.join(path.dirname(file), assetName).replace(/\\/g, '/');
        if (fs.existsSync(assetPath)) {
          fs.appendFileSync(file, rules[type].add(assetName), 'utf-8');
        }
      }

      // Mandatory imports at the end
      rules[type].append.forEach(function(item) {
        fs.appendFileSync(file, rules[type].add(item), 'utf-8');
      });
    });
  }
}

// Get files paths from entry point
function getFileList(entryPoint, context) {
  let entryFiles = [];
  if (typeof entryPoint === "string") {
    // If path is string use as is
    entryFiles.push(path.resolve(context, entryPoint));
  }
  else {
    // Else exclude paths with node_modules
    // (webpack-dev-server files, prepended to entry files in the array)
    const filteredPaths = entryPoint.filter(entryPath => !entryPath.includes('node_modules'));
    filteredPaths.forEach(entryPath => {
      entryFiles.push(path.resolve(context, entryPath));
    });
  }
  return entryFiles;
}

// Get BEM list from pug template or AST.
// BEM entities in pug template should be added with +entity or as classes.
// BEM entities in AST should be added as mixins or as block classes.
function getBemList(context, file, type) {
  const data = getData(context, file, type);
  let bems = new Set();
  let exts;
  if (type === 'pug') {
    const re = /\+([^(\s]+)(?:\(.*?\))?(?:\(class='(.*?)'\))?/g;
    let match;
    while (match = re.exec(data)) {
      match.slice(1).forEach(block => {
        if (block) {
          bems.add(block);
        }
      });
    }
  }
  else if (type === 'ast') {
    walk(data, function before(node, replace) {
      if (node.type === 'Include') {
        return false;
      }
      if (node.type === 'Mixin' && !node.name.includes('_')) {
        bems.add(node.name);
      }
      if (node.type === 'Extends') {
        exts = node.file.path;
      }
      if (node.attrs) {
        node.attrs.forEach(attr => {
          if (attr.name === 'class') {
            const classes = attr.val.split(' ');
            classes.forEach(class_ => {
              if (!class_.includes('_')) {
                bems.add(class_.replace(/['"]/g, ''));
              }
            });
          }
        });
      }
    }, {
      includeDependencies: true
    })
  }
  else if (type === 'html') {
    const re = /class=['"](.*?)['"]/g;
    let match;
    while (match = re.exec(data)) {
      const classes = match[1].split(' ');
      console.log(classes);
      classes.forEach(class_ => {
        if (!class_.includes('_')) {
          bems.add(class_);
          console.log(class_);
        }
      });
    }
  }
  return { bems: Array.from(bems), extends: exts };
}

// Aggregate mixins of all bem entities in one file
function aggregateMixins(context) {
  const blocksPath = path.join(context, 'blocks');

  /*
  Rules for mixins aggregation:
  file - string, containg path to generated file
  include - function generating string for including/importing files
  fileList - array of paths to files
  */
  let bems = {
    pug: {
      file: path.join(blocksPath, 'mixins.pug'),
      include: function(entityPath) {
        return `include /${path.relative(blocksPath, entityPath).replace(/\\/g, '/')}\n`;
      },
      fileList: []
    },
    scss: {
      file: path.join(blocksPath, 'mixins.scss'),
      include: function(entityPath) {
        return `@import '${path.relative(blocksPath, entityPath).replace(/\\/g, '/')}';\n`;
      },
      fileList: []
    }
  };

  fillBemFilesList(blocksPath, { '.pug': bems.pug.fileList, '.scss': bems.scss.fileList });

  // Write files
  for (type in bems) {
    fs.writeFileSync(bems[type].file, rules[type].message);
    bems[type].fileList.forEach(function(entityPath) {
      fs.appendFileSync(bems[type].file, bems[type].include(entityPath), 'utf-8');
    });
  }
}

// Fill bem files list
function fillBemFilesList(root, lists) {
  const blocks = fs.readdirSync(root, { encoding: 'utf-8', withFileTypes: true });
  blocks.forEach(function(entity){
    const entityPath = path.join(root, entity.name);
    if (entity.isFile()) {
      // Add only pug and scss files; don't add generated files and variables (both added in page files).
      if (path.extname(entity.name) in lists && !['mixins', 'variables'].includes(path.parse(entity.name).name)) {
        lists[path.extname(entity.name)].push(entityPath);
      }
    }
    else if (entity.isDirectory()) {
      fillBemFilesList(entityPath, lists);
    }
  });
}

function getData(context, file, type) {
  switch (type) {
    case 'pug':
      return fs.readFileSync(file, 'utf-8');
    case 'ast':
      return load.file(file, {
        lex: lex,
        parse: parse,
        basedir: path.join(context, 'blocks')
      });
    case 'html':
      return pug.renderFile(file, {
        basedir: path.join(context, 'blocks'),
        require: path => path
      });
  }
}

module.exports = { aggregateMixins, generateEntries, getFileList }