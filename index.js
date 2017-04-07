const dive = require("dive");
const path = require("path");
const md5 = require("md5-file");
const camelCase = require("camelcase");
const fs = require("fs-extra");
const handlebars = require("handlebars");

function collectAssets(config, callback) {
  const { assetsPath, replacePath, buildUrl } = config;
  let assets = [];
  dive(
    assetsPath,
    (err, file, stat) => {
      if (err) throw new Error(err);

      const fileName = replacePath(file);
      const hash = md5.sync(file);
      const url = buildUrl(fileName, hash);
      const elmName = createElmName(fileName);
      assets.push({ url, elmName });
    },
    () => callback(assets)
  );
}

function createElmName(fileName) {
  const elmName = fileName
    .split("/")
    .map(s => s.split("."))
    .reduce((i, acc) => i.concat(acc))
    .map(s => camelCase(s))
    .join("_")
    .replace("@", "_");
  if (elmName.match(/^[0-9]/)) {
    return "img" + elmName;
  } else {
    return elmName;
  }
}

function writeElmFile(config, assets, callback) {
  const { outputPath, moduleNamespace } = config;
  fs.mkdirpSync(path.join(outputPath, moduleNamespace));
  var template = handlebars.compile(elmTemplate);
  var out = template({ moduleName: moduleNamespace + ".Assets", assets });
  fs.writeFile(
    path.join(outputPath, moduleNamespace, "Assets.elm"),
    out,
    function(err) {
      if (err) callback(err);
      callback(
        null,
        `Wrote ${path.join(outputPath, moduleNamespace, "Assets.elm")} (${assets.length} image assets)`
      );
    }
  );
}

var elmTemplate = `module {{moduleName}} exposing (..)

{-|
{{#each assets}}
@docs {{elmName}}
{{/each}}
-}

import AssetPath exposing (Asset(AssetPath))
{{#each assets}}


{-| -}
{{elmName}} : Asset
{{elmName}} =
    AssetPath "{{url}}"
{{/each}}
`;

module.exports = {
  // TODO check config
  buildElmAssets: (config, callback) =>
    collectAssets(config, assets => writeElmFile(config, assets, callback)),
  createElmName,
  collectAssets,
  writeElmFile
};
