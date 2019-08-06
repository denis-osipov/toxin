// Generators for AssetsGenerationPlugin

const path = require('path');
const fs = require('fs');

// Generate entries js files
function generateEntries(context, entry) {
  const blocksPath = path.join(context, 'blocks');
  for (point in entry) {
    let entryPath;
    if (typeof entry[point] === "string") {
      entryPath = path.resolve(context, entry[point]);
    }
    else {
      entryPath = path.resolve(context, entry[point][1]);
    }
    const templatePath = entryPath.replace('.js', '.pug');
    const stylePath = entryPath.replace('.js', '.scss');

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const bems = getBemList(templateContent);

    let entryContent = '// File generated automatically.\n// Any changes will be discarded during next compilation.\n\n';

    // Import page styles, if exist
    if (fs.existsSync(stylePath)) {
      entryContent += `import './${path.basename(stylePath)}';\n`;
    }

    bems.forEach(function(entity) {
      const entityPath = path.join(blocksPath, entity, entity + '.js');
      if (fs.existsSync(entityPath)) {
        entryContent += `import '${path.relative(path.dirname(entryPath), entityPath).replace(/\\/g, '/')}';\n`;
      }
    });
    fs.writeFileSync(entryPath, entryContent);
  }
}

// Get bem list from pug template (bem entities added with +bem('name'))
function getBemList(data) {
  let bems = new Set();
  const re = /\+([^(\s]+)/g;
  let match;
  while (match = re.exec(data)) {
    bems.add(match[1]);
  }
  return Array.from(bems);
}

// Aggregate mixins of all bem entities in one file
function aggregateMixins(context) {
  const blocksPath = path.join(context, 'blocks');
  const bemFilePath = path.join(blocksPath, 'mixins.pug');
  let bems = [];
  getBemFilesList(blocksPath, bems);

  let message = '//- File generated automatically.\n//- Any changes will be discarded during next compilation.\n\n';
  fs.writeFileSync(bemFilePath, message);
  bems.forEach(function(entityPath) {
      const include = `include /${path.relative(blocksPath, entityPath).replace(/\\/g, '/')}\n`;
      fs.appendFileSync(bemFilePath, include, 'utf-8');
  });
}

// Get bem files list
function getBemFilesList(root, list) {
  const blocks = fs.readdirSync(root, { encoding: 'utf-8', withFileTypes: true });
  blocks.forEach(function(entity){
    const entityPath = path.join(root, entity.name);
    if (entity.isFile() && entity.name.endsWith('.pug') && entity.name !== 'mixins.pug') {
      list.push(entityPath);
    }
    else if (entity.isDirectory()) {
      getBemFilesList(entityPath, list);
    }
  })
}

module.exports = { aggregateMixins, generateEntries }