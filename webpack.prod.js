const { merge } = require("webpack-merge");
const TerserPlugin = require("terser-webpack-plugin");
const foreground = require("./webpack.common.foreground");
const background = require("./webpack.common.background");

const foreground_prod = merge(foreground, {
  mode: "production",
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
});

const background_prod = merge(background, {
  mode: "production",
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
});

module.exports = [foreground_prod, background_prod];