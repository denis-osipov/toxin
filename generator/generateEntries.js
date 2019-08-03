// Module for EntryGenerationPlugin

const path = require('path');
const fs = require('fs');

function generateEntryPoinst(context, entry) {
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

module.exports = generateEntryPoinst;