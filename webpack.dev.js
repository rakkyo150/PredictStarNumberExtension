const { merge } = require("webpack-merge");
const foreground = require("./webpack.common.foreground");
const background = require("./webpack.common.background");

const foreground_dev = merge(foreground, {
    mode: "development",
});

const background_dev = merge(background, {
    mode: "development",
});

module.exports = [foreground_dev, background_dev];
