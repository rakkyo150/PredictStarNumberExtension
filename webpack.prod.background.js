const { merge } = require("webpack-merge");
const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");
const background = require("./webpack.common.background");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = merge(background, {
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'release'),
  },
  optimization: {
      minimize: true,
      minimizer: [
          new TerserPlugin({
              terserOptions: {
                  compress: {
                      drop_console: true,
                  },
              },
          }),
      ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: ".",
          context: "public",
          to: "../release",
        },
      ],
    }),
  ]
});