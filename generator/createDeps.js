const Generator = require('./generator');

const generator = new Generator(['./src/blocks', './src/pages'], true, true);
generator.generate();