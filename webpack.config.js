const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const DependencyGenerationPlugin = require('./generator/DependencyGenerationPlugin');

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    writeToDisk: true
  },
  context: path.resolve(__dirname, 'src'),
  entry: {
    // colorsAndType: [
    //   './pages/colors-and-type/colors-and-type.scss'
    // ],
    // formElements: [
    //   './pages/form-elements/form-elements.scss',
    //   './pages/form-elements/form-elements.js'
    // ],
    cards: [
      './pages/cards/cards.scss',
      './pages/cards/cards.js'
    ]
  },
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
          'resolve-url-loader', // needed for correct path resolving
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
    new CleanWebpackPlugin(),
    // new HtmlWebpackPlugin({
    //   template: './pages/colors-and-type/colors-and-type.pug',
    //   filename: 'colors-and-type.html',
    //   chunks: ['colorsAndType']
    // }),
    // new HtmlWebpackPlugin({
    //   template: './pages/form-elements/form-elements.pug',
    //   filename: 'form-elements.html',
    //   chunks: ['formElements']
    // }),
    new HtmlWebpackPlugin({
      template: './pages/cards/cards.pug',
      filename: 'cards.html',
      chunks: ['cards']
    })
  ],
  resolve: {
    alias: {
      blocksPath: path.resolve(__dirname, 'src/blocks'), // for correct paths to required assets in pug mixins
      images: path.resolve(__dirname, 'src/images'),
      './dependencyLibs/inputmask.dependencyLib': './dependencyLibs/inputmask.dependencyLib.jquery'
    }
  }
}