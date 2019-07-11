const path = require('path')

module.exports = {
  entry: './index.js',
  mode: 'production',
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.(js|jsx)$/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  output: {
    filename: 'index.js',
    library: 'toggles',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
  },
}
