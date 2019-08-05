// Module for MixinsAggregationPlugin

const path = require('path');
const fs = require('fs');

function aggregateMixins(context, entry) {
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

module.exports = aggregateMixins;