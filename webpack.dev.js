const { merge } = require("webpack-merge");
const path = require('path');
const foreground = require("./webpack.common.foreground");
const background = require("./webpack.common.background");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const foreground_dev = merge(foreground, {
    mode: "development",
    output: {
      path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
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
});

const background_dev = merge(background, {
    mode: "development",
    output: {
      path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
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
});

module.exports = [foreground_dev, background_dev];
