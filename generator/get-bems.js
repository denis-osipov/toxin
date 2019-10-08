// Helpers for getting data from pug-files
const fs = require('fs');
const path = require('path');
const lex = require('pug-lexer');
const parse = require('pug-parser');
const walk = require('pug-walk');

// Get BEM list from pug file.
// BEM entities should be added as mixins or as classes.
function getBems(filePath, exclude) {
  const ast = getAst(filePath);
  let bems = new Set();
  let extends_;
  walk(ast, function before(node, replace) {
    if (node.type === 'Include') {
      return false;
    }
    else if (
      node.type === 'Mixin' &&
      node.call &&
      !exclude.includes(node.name)
    ) {
      bems.add(node.name);
    }
    else if (node.type === 'Extends') {
      const ext = path.extname(node.file.path);
      extends_ = path.basename(node.file.path, ext);
    }

    if (node.attrs) {
      node.attrs.forEach(attr => {
        if (attr.name === 'class') {
          const classes = attr.val.split(' ');
          classes.forEach(class_ => {
            const bemClass = class_.replace(/['"]/g, '');
            if (!(
              exclude.includes(bemClass) ||
              bemClass.match(/[^A-Za-z0-9_\-]/))) {
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

module.exports = getBems;