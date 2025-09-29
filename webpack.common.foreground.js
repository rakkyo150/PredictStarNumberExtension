const path = require('path');
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

module.exports = {
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".wasm"],
  },
  devtool: 'cheap-module-source-map',
  entry: {ScoreSaber: './src-ts/ScoreSaber.ts', BeatSaver: './src-ts/BeatSaver.ts'},
  output: {
    publicPath: '',
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true
        }
      }
    ]
  },
};
