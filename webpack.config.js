const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const Fiber = require('fibers');
const AssetsGenerationPlugin = require('./generator/AssetsGenerationPlugin');

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    writeToDisk: true
  },
  context: path.resolve(__dirname, 'src'),
  entry: {
    colorsAndType: './pages/colors-and-type.js'
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
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
              fiber: Fiber
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
              root: path.resolve(__dirname, 'src/blocks')
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new AssetsGenerationPlugin(),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './pages/colors-and-type.pug',
      filename: 'colors-and-type.html',
      chunks: ['colorsAndType']
    })
  ],
  resolve: {
    alias: {
      blocksPath: path.resolve(__dirname, 'src/blocks')
    }
  }
}