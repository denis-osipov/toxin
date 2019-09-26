// Global rules for file types:
const path = require('path');
const eol = require('os').EOL;

/*
warningMessage - array of strings for warning message about file generation
addBem - function generating import strings for regular BEM entities
addExtends - function generating import strings for pug extends
*/
const warningMessage = [
  '',
  `File generated automatically.${eol}`,
  `Any changes will be discarded during next compilation.${eol}${eol}`
];

const rules = {
  '.js': {
    commentStart: '// ',
    addBem: function(depFile, entityFile) {
      let importPath = path.relative(path.dirname(entityFile), depFile).replace(/\\/g, '/');
      if (!importPath.match(/^\.{0,2}\//)) {
        importPath = './' + importPath;
      }
      return `import '${importPath}';${eol}`;
    }
  },
  '.scss': {
    commentStart: '// ',
    addBem: function(depFile, entityFile) {
      return `@import '${path.relative(path.dirname(entityFile), depFile).replace(/\\/g, '/')}';${eol}`;
    }
  },
  '.pug': {
    commentStart: '//- ',
    addBem: function(depFile, entityFile, isExtends) {
      if (isExtends) {
        // Extended file is already included
        return '';
      }
      return `include ${path.relative(path.dirname(entityFile), depFile).replace(/\\/g, '/')}${eol}`;
    }
  }
};

module.exports = { warningMessage, rules };