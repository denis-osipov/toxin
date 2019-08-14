const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const AssetsGenerationPlugin = require('./generator/AssetsGenerationPlugin');

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    writeToDisk: true
  },
  context: path.resolve(__dirname, 'src'),
  entry: {
    colorsAndType: [
      './pages/colors-and-type/colors-and-type.scss'
    ],
    formElements: [
      './pages/form-elements/form-elements.scss',
      './pages/form-elements/form-elements.js'
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
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              outFile: 'style.css', // node-sass docs says outFile is required for sourceMap
              includePaths: [
                path.resolve(__dirname, 'src/blocks'),
                path.resolve(__dirname, 'src')
              ]
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
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './pages/colors-and-type/colors-and-type.pug',
      filename: 'colors-and-type.html',
      chunks: ['colorsAndType']
    }),
    new HtmlWebpackPlugin({
      template: './pages/form-elements/form-elements.pug',
      filename: 'form-elements.html',
      chunks: ['formElements']
    })
  ],
  resolve: {
    alias: {
      blocksPath: path.resolve(__dirname, 'src/blocks')
    }
  }
}