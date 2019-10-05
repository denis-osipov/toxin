const Generator = require('../generator/generator');

const generator = new Generator(['./test/blocks'], true, true);
generator.generate();