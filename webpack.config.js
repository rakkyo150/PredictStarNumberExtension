const path = require('path')

module.exports = {
  mode: 'development',
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"]
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
  plugins: []
};
