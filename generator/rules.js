// Global rules for file types:
const path = require('path');
const eol = require('os').EOL;

/*
warningMessage - array of strings for warning message about file generation
addBem - function generating import strings for regular BEM entities
addExtends - function generating import strings for pug extends
*/
const startMessage = [
  `Automatically generated imports.`,
  `Any changes in this block will be discarded during next compilation.`
];

const endMessage = [ `End of block with automatically generated imports.` ];

const rules = {
  '.js': {
    commentStart: '// ',
    addBem: function(depFile, entityFile) {
      let importPath = path.relative(path.dirname(entityFile), depFile).replace(/\\/g, '/');
      if (!importPath.match(/^\.{0,2}\//)) {
        importPath = './' + importPath;
      }
      return `import '${importPath}';`;
    },
    importsRe: /import '.+';/g
  },
  '.scss': {
    commentStart: '// ',
    addBem: function(depFile, entityFile) {
      return `@import '${path.relative(path.dirname(entityFile), depFile).replace(/\\/g, '/')}';`;
    },
    importsRe: /@import '.+';/g
  },
  '.pug': {
    commentStart: '//- ',
    addBem: function(depFile, entityFile, isExtends) {
      if (isExtends) {
        // Extended file is already included
        return '';
      }
      return `include ${path.relative(path.dirname(entityFile), depFile).replace(/\\/g, '/')}`;
    },
    importsRe: /include .+/g
  }
};

Object.values(rules).forEach(props => {
  props.startMessage = [];
  props.endMessage = [];
  startMessage.forEach(value => {
    props.startMessage.push(props.commentStart + value);
  });
  endMessage.forEach(value => {
    props.endMessage.push(props.commentStart + value);
  });
  Object.assign(props, {
    blockRe: new RegExp(`${props.startMessage.join('.*')}(.*)${props.endMessage.join('.*')}\\s*`, 's')
  });
});

module.exports = rules;