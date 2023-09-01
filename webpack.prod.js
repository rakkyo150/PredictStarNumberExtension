const { merge } = require("webpack-merge");
const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");
const foreground = require("./webpack.common.foreground");
const background = require("./webpack.common.background");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const foreground_prod = merge(foreground, {
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

const background_prod = merge(background, {
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

module.exports = [foreground_prod, background_prod];