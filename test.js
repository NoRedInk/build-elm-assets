import test from "ava";
import mock from "mock-require";
import buildElmAssets from "./index.js";

test("createElmName", t => {
  const { createElmName } = buildElmAssets;

  let fileName = "folder/foo_bar.png";
  let expected = "folder_fooBar_png";
  t.is(createElmName(fileName), expected);

  fileName = "1foo_bar.png";
  expected = "img1fooBar_png";
  t.is(createElmName(fileName), expected);

  fileName = "1foo-bar.png";
  expected = "img1fooBar_png";
  t.is(createElmName(fileName), expected);

  fileName = "Foo.png";
  expected = "foo_png";
  t.is(createElmName(fileName), expected);

  fileName = "Foo@2x.png";
  expected = "foo_2x_png";
  t.is(createElmName(fileName), expected);
});

function mockModule(files) {
  mock("dive", function(path, cb, done) {
    files.map(i => cb(null, i));
    done();
  });
  mock("md5-file", { sync: () => "HASH" });
  return mock.reRequire("./index.js");
}

test("collectAssets", t => {
  const { collectAssets } = mockModule(["foo.png", "bar.png"]);
  const config = {
    assetsPath: "app/assets/",
    replacePath: s => s.replace("app", "_app_"),
    buildUrl: (fileName, hash) => fileName.replace(/\./, "-" + hash + ".")
  };
  const expected = [
    {
      elmName: "foo_png",
      url: "foo-HASH.png"
    },
    {
      elmName: "bar_png",
      url: "bar-HASH.png"
    }
  ];
  const callback = actual => t.deepEqual(actual, expected);
  collectAssets(config, callback);
});

test("writeElmFile", t => {
  mock("fs-extra", {
    mkdirpSync: p => t.is(p, "src/Nri"),
    writeFile: (p, content, cb) => {
      t.is(p, "src/Nri/Assets.elm");
      t.regex(content, /img1_png : Asset/);
      t.regex(content, /img2_png : Asset/);
      t.regex(content, /AssetPath \"assets\/img1.png\"/);
      t.regex(content, /AssetPath \"assets\/img2.png\"/);
      cb();
    }
  });
  const { writeElmFile } = mock.reRequire("./index.js");
  const config = {
    outputPath: "src/",
    moduleNamespace: "Nri"
  };
  const expected = "Wrote src/Nri/Assets.elm (2 image assets)";
  const assets = [
    { elmName: "img1_png", url: "assets/img1.png" },
    { elmName: "img2_png", url: "assets/img2.png" }
  ];
  const done = (err, actual) => t.is(actual, expected);
  writeElmFile(config, assets, done);
});
