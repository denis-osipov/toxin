const Generator = require('../generator/generator');

const generator = new Generator(['./blocks'], true, true);
generator.generate();