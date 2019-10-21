const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const DependencyGenerationPlugin = require('./generator/DependencyGenerationPlugin');

module.exports = merge.smart({
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    writeToDisk: true
  },
  output: {
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|gif)$/i,
        exclude: path.resolve(__dirname, 'src/fonts'),
        use:[
          {
            loader: 'file-loader',
            options: {
              name: 'images/[name].[contenthash].[ext]'
            }
          }
        ]
      },
      {
        test: /\.(c|sc)ss$/i,
        use: [ 'style-loader' ]
      }
    ]
  },
  plugins: [
    new DependencyGenerationPlugin({
      folders: [
        path.resolve(__dirname, 'src/blocks'),
        path.resolve(__dirname, 'src/pages')
      ],
      clear: true
    })
  ]
}, common);