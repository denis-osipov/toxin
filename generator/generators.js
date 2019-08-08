// Generators for AssetsGenerationPlugin

const path = require('path');
const fs = require('fs');

// Global rules for file types
const rules = {
  js: {
    message: '// File generated automatically.\n// Any changes will be discarded during next compilation.\n\n',
    prepend: [],
    use: function(entityFile, entryFile) {
      return `import '${path.relative(path.dirname(entryFile), entityFile).replace(/\\/g, '/')}';\n`;
    }
  },
  scss: {
    message: '// File generated automatically.\n// Any changes will be discarded during next compilation.\n\n',
    prepend: [
      `@import 'fonts/fonts';\n`,
      `@import 'colors/colors.scss';\n`,
      `@import 'mixins';\n`
    ],
    use: function(entityFile) {
      const entity = path.basename(entityFile, '.scss');
      return `@include ${entity};\n`;
    }
  },
  pug: {
    message: '//- File generated automatically.\n//- Any changes will be discarded during next compilation.\n\n'
  }
};

// Generate entries js files
function generateEntries(context, entry) {
  const blocksPath = path.join(context, 'blocks');
  for (point in entry) {

    let entryFiles = getFileList(entry[point], context);

    // Get list of used bem entities
    const templateFile = entryFiles[0].replace(/\.(js|scss)$/, '.pug');
    const templateContent = fs.readFileSync(templateFile, 'utf-8');
    const usedBems = getBemList(templateContent);

    // Write files
    entryFiles.forEach(function(file) {
      const type = path.extname(file).slice(1);
      fs.writeFileSync(file, rules[type].message); // warning about autogeneration

      // Mandatory imports
      rules[type].prepend.forEach(function(row) {
        fs.appendFileSync(file, row, 'utf-8');
      });

      // Add used bem entities
      usedBems.forEach(function(entity) {
        const entityFile = path.join(blocksPath, entity, entity + `.${type}`);
        if (fs.existsSync(entityFile)) {
          fs.appendFileSync(file, rules[type].use(entityFile, file), 'utf-8');
        }
      });
    });
  }
}

function getFileList(entryPoint, context) {
  let entryFiles = [];
  if (typeof entryPoint === "string") {
    entryFiles.push(path.resolve(context, entryPoint));
  }
  else {
    const filteredPaths = entryPoint.filter(entryPath => !entryPath.includes('node_modules'));
    filteredPaths.forEach(entryPath => {
      entryFiles.push(path.resolve(context, entryPath));
    });
  }
  return entryFiles;
}

// Get bem list from pug template (bem entities added with +bem('name'))
function getBemList(data) {
  let bems = new Set();
  const re = /\+([^(\s]+)(?:\(.*?\))?(?:\(mix='(.*?)'\))?/g;
  let match;
  while (match = re.exec(data)) {
    match.slice(1).forEach(block => {
      if (block) {
        bems.add(block);
      }
    });
  }
  return Array.from(bems);
}

// Aggregate mixins of all bem entities in one file
function aggregateMixins(context) {
  const blocksPath = path.join(context, 'blocks');

  // Rules for mixins aggregation
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
      if (path.extname(entity.name) in lists && path.parse(entity.name).name !== 'mixins') {
        lists[path.extname(entity.name)].push(entityPath);
      }
    }
    else if (entity.isDirectory()) {
      fillBemFilesList(entityPath, lists);
    }
  });
}

module.exports = { aggregateMixins, generateEntries, getFileList }