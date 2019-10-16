// Global rules for file types:
const path = require('path');
const eol = require('os').EOL;

/*
warningMessage - array of strings for warning message about file generation
addBem - function generating import strings for regular BEM entities
addExtends - function generating import strings for pug extends
*/
const startMessage = [
  '',
  `Automatically generated imports.${eol}`,
  `Any changes in this block will be discarded during next compilation.${eol}`
];

const endMessage = [
  '',
  `End of block with automatically generated imports.${eol}${eol}`
];

const rules = {
  '.js': {
    commentStart: '// ',
    addBem: function(depFile, entityFile) {
      let importPath = path.relative(path.dirname(entityFile), depFile).replace(/\\/g, '/');
      if (!importPath.match(/^\.{0,2}\//)) {
        importPath = './' + importPath;
      }
      return `import '${importPath}';`;
    }
  },
  '.scss': {
    commentStart: '// ',
    addBem: function(depFile, entityFile) {
      return `@import '${path.relative(path.dirname(entityFile), depFile).replace(/\\/g, '/')}';`;
    }
  },
  '.pug': {
    commentStart: '//- ',
    addBem: function(depFile, entityFile, isExtends) {
      if (isExtends) {
        // Extended file is already included
        return '';
      }
      return `include ${path.relative(path.dirname(entityFile), depFile).replace(/\\/g, '/')}`;
    }
  }
};

module.exports = { startMessage, endMessage, rules };