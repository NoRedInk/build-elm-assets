Build Elm Assets
================

> Generates a file containing assets from a given folder and containing a hash in the urls.


## Example

```elm
const { buildElmAssets } = require("build-elm-assets");
var path = require("path");

const config = {
  // path to your assets
  assetsPath: path.join("app", "assets", "images"),
  // asset gets copied to this folder if provided
  assetsOutputPath: path.join("public/copies"),
  // link to assetsOutputPath with hash goes here
  // this is only useful when you copy the file using assetsOutputPath
  assetsLink: path.join("public"),
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
