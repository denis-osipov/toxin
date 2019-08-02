// Script for generating entry points from webpack.config.entry object

const path = require('path');
const fs = require('fs');
const config = require('./webpack.config');
const blocksPath = path.join(config.context, 'blocks');

for (point in config.entry) {
  const entryPath = path.resolve(config.context, config.entry[point]);
  const templatePath = entryPath.replace('.js', '.pug');

  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  const bems = getBemList(templateContent);

  let entryContent = '// File generated automatically.\n// Any changes will be discarded during next compilation.\n\n';
  bems.forEach(function(entity) {
    const entityPath = path.join(blocksPath, entity, entity + '.js');
    if (fs.existsSync(entityPath)) {
      entryContent += `import '${path.relative(path.dirname(entryPath), entityPath).replace(/\\/g, '/')}';\n`;
    }
  });
  fs.writeFileSync(entryPath, entryContent);
}


// Get bem list from pug template (bem entities added with +bem('name'))
function getBemList(data) {
  let bems = new Set();
  const re = /\+bem\('(.+?)'\)/g;
  let match;
  while (match = re.exec(data)) {
    bems.add(match[1]);
  }
  return Array.from(bems);
}