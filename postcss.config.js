const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const postcssImport = require("postcss-import");

module.exports = {
  plugins: [
    postcssImport({
      root: __dirname,
    }),
    autoprefixer,
    cssnano({
      preset: "default",
    }),
  ]
};
