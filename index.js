const dive = require("dive");
const path = require("path");
const md5 = require("md5-file");
const camelCase = require("camelcase");
const fs = require("fs-extra");
const handlebars = require("handlebars");

function collectAssets(config, callback) {
  const { assetsPath, replacePath, buildUrl } = config;
  let assets = [];
  try {
    dive(
      assetsPath,
      (err, file) => {
        if (err) throw new Error(err);

        const fileName = replacePath(file);
        const hash = md5.sync(file);
        const url = buildUrl(fileName, hash);
        const elmName = createElmName(fileName);
        assets.push({ url, elmName });
      },
      () => checkForDuplications(assets, callback)
    );
  } catch (e) {
    callback(e);
  }
}

function checkForDuplications(assets, callback) {
  const dups = findDuplicatesBy(assets, x => x.elmName);
  if (dups.length !== 0) {
    const error = new Error(
      `I had troubles creating a uniq \`elmName\` for: ${dups.join(", ")}.`
    );
    callback(error);
  } else {
    callback(null, assets);
  }
}

function findDuplicatesBy(list, findBy) {
  return list.reduce(
    ({ dups, uniq }, item) => {
      const by = findBy(item);
      if (uniq.includes(by)) {
        const u = uniq.find(x => x === by);
        return {
          dups: [u, by, ...dups],
          uniq: uniq
        };
      } else {
        return {
          uniq: [by, ...uniq],
          dups: dups
        };
      }
    },
    { dups: [], uniq: [] }
  ).dups;
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

function validateConfig(config) {
  const errors = [];
  if (typeof config.assetsPath !== "string") {
    errors.push(
      'You need to define `assetsPath` as a string. i.e. "app/assets/images"'
    );
  }
  if (typeof config.outputPath !== "string") {
    errors.push(
      'You need to define `outputPath` as a string. i.e. "src/generated/"'
    );
  }
  if (typeof config.outputPath !== "string") {
    errors.push('You need to define `moduleNamespace` as a string. i.e. "Nri"');
  }
  if (typeof config.replacePath !== "function") {
    errors.push(
      "You need to define `replacePath` as a string. i.e. \"fileName => fileName.replace(/app/assets/, '')\""
    );
  }
  if (typeof config.buildUrl !== "function") {
    errors.push(
      "You need to define `buildUrl` as a string. i.e. \"(fileName, hash) => 'assets/' + hash + '-' + fileName\""
    );
  }
  if (errors.length > 0) throw new Error(errors.join("\n"));
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
  buildElmAssets: (config, callback) => {
    validateConfig(config);
    collectAssets(config, (err, assets) =>
      writeElmFile(config, assets, callback));
  },
  createElmName,
  collectAssets,
  writeElmFile,
  validateConfig
};
