Build Elm Assets
================

[![Build Status](https://travis-ci.org/NoRedInk/build-elm-assets.svg?branch=master)](https://travis-ci.org/NoRedInk/build-elm-assets)

> Generates a file containing assets from a given folder and containing a hash in the urls.


## Example

```elm
const { buildElmAssets } = require("build-elm-assets");
var path = require("path");

const config = {
  // path to your assets
  assetsPath: path.join("app", "assets", "images"),
  // assets get copied to this folder if provided with the url created with buildUrl
  assetsOutputPath: path.join("public"),
  // function to modify the asset path this path will be passed to buildUrl
  replacePath: fileName => fileName.replace(/.*\/app\/assets\/images\//, ""),
  // function to create the url used in the generated file
  buildUrl: (fileName, hash) =>
    "/assets/" + fileName.replace(/\./, "-" + hash + "."),
  // path to the folder where the generated file should go
  outputPath: path.join("src", "generated"),
  // namespace for the elm module
  moduleNamespace: "Nri"
};

// this creates a file src/generated/Nri/Assets.elm
buildElmAssets(config, (err, msg) => {
  if (err) console.error(err);
  console.log(msg);
});
```
