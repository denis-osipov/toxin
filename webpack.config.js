const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const DependencyGenerationPlugin = require('./generator/DependencyGenerationPlugin');
const toDashString = require('./utils/convert').toDashString;

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    writeToDisk: true
  },
  context: path.resolve(__dirname, 'src'),
  entry: {},
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|gif)$/,
        use:[
          'file-loader'
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          'file-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'resolve-url-loader',
            options: {
              removeCR: true // to prevent 'no orphan CR found'
            }
          }, // needed for correct path resolving
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true, // must be set for resolve-url-loader working
              sassOptions: {
                // Where looking for files to import with absolute paths
                includePaths: [
                  path.resolve(__dirname, 'src/blocks'),
                  path.resolve(__dirname, 'src')
                ]
              }
            }
          }
        ]
      },
      {
        test: /\.pug$/,
        use: [
          {
            loader: 'pug-loader',
            options: {
              // Base dir for absolute imports
              root: path.resolve(__dirname, 'src/blocks')
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new DependencyGenerationPlugin({
      folders: [
        path.resolve(__dirname, 'src/blocks'),
        path.resolve(__dirname, 'src/pages')
      ]
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new CleanWebpackPlugin()
  ],
  resolve: {
    alias: {
      blocksPath: path.resolve(__dirname, 'src/blocks'), // for correct paths to required assets in pug mixins
      images: path.resolve(__dirname, 'src/images')
    }
  }
}

const pathToEntries = path.join(module.exports.context, 'pages');
const types = ['.js', '.scss'];

[
  'searchRoom'
].forEach(entryName => {
  const entryFiles = [];
  const dashedName = toDashString(entryName);
  const pathToEntry = path.join(pathToEntries, dashedName);
  types.forEach(type => {
    const entryFile = path.join(pathToEntry, `${dashedName}${type}`);
    if (fs.existsSync(entryFile)) {
      entryFiles.push(entryFile);
    }
  });
  if (entryFiles.length) {
    module.exports.entry[entryName] = entryFiles;
  }
  module.exports.plugins.push(
    new HtmlWebpackPlugin({
      template: path.join(pathToEntry, `${dashedName}.pug`),
      filename: `${dashedName}.html`,
      chunks: [entryName]
    }),
  );
});