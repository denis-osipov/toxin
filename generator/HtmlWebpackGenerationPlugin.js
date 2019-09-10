const runLoaders = require("loader-runner").runLoaders;

class HtmlWebpackGenerationPlugin {
  apply (compiler) {
    compiler.hooks.compilation.tap(
      'HtmlWebpackGenerationPlugin',
      (compilation, compilationParams) => {
        let loaderContext = {};
        compilation.hooks.normalModuleLoader.call(loaderContext);
        let template;
        runLoaders({
          resource: 'D:/fsd/toxin/src/pages/colors-and-type/colors-and-type.pug',
          loaders: [{
            loader: 'D:/fsd/toxin/node_modules/pug-loader/index.js',
            options: {
              root: 'D:/fsd/toxin/src/blocks',
            }
          }],
          context: loaderContext
        }, (err, result) => {
          template = result;
        });

        compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync(
          'HtmlWebpackGenerationPlugin',
          (pluginArgs, callback) => {
            callback();
          });

      });
  }
}

module.exports = HtmlWebpackGenerationPlugin;