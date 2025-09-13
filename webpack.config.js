const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/editor-runtime/editor-runtime.ts',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'runtime.js',
    path: path.resolve(__dirname, 'public/__editor'),
    library: {
      type: 'umd',
      name: 'EditorRuntime',
    },
    globalObject: 'this',
  },
  optimization: {
    minimize: true,
    splitChunks: false,
  },
  devtool: 'source-map',
};
