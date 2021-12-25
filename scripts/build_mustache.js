const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const minify = require("html-minifier").minify;
const Mustache = require("mustache");

const templateBaseDir = path.join(__dirname, "..", "public");
const templatePath = path.join(templateBaseDir, "index.mustache");
const outputPath = path.join(templateBaseDir, "index.html");
const templateBuffer = fs.readFileSync(templatePath);
const template = templateBuffer.toString("utf-8");
const rendered = Mustache.render(template, {
  __ASSETS_BASE_PATH: process.env.ASSETS_BASE_PATH,
  __BUILD_ID: process.env.BUILD_ID,
  __CACHE_BUST: process.env.CACHE_BUST,
  __STATIC_BASE_PATH: process.env.STATIC_BASE_PATH,

  integrity: function () {
    return function (text, render) {
      const hash = crypto.createHash("sha384");
      const filename = render(text);
      const fileContents = fs.readFileSync(path.join(templateBaseDir, filename)).toString("utf-8");

      return "sha384-" + hash.update(fileContents, "utf-8").digest("base64");
    };
  },
});

fs.writeFileSync(outputPath, minify(rendered), "utf-8");
