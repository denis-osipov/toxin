// If your plugin is direct dependent to the html webpack plugin:

class HtmlWebpackGenerationPlugin {
  apply (compiler) {
    compiler.hooks.compilation.tap(
      'HtmlWebpackGenerationPlugin',
      (compilation, compilationParams) => {

        compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tapAsync(
          'HtmlWebpackGenerationPlugin',
          (pluginArgs, callback) => {
            console.log(pluginArgs);
            callback();
          });

      });
  }
}

module.exports = HtmlWebpackGenerationPlugin;