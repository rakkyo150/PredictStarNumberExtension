const path = require('path')
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: 'development',
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", "wasm"]
  },
  experiments: {
    asyncWebAssembly: true
  },
  devtool: 'cheap-module-source-map',
  entry: {ScoreSaber: './src-ts/ScoreSaber.ts', BeatSaver: './src-ts/BeatSaver.ts'},
  output: {
    publicPath: '',
    path: path.resolve(__dirname, 'dist'),
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
  plugins: [
    new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, "pkg"),
      outDir: path.resolve(__dirname, "pkg"),
      outName: "predict_star_number_extension",
      extraArgs: "--target web",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: ".",
          context: "public",
          to: "../dist",
        },
      ],
    }),
  ]
};
