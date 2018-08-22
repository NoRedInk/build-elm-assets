import test from "ava";
import path from "path";
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

test("collectAssets should invoke the callback with sorted assets", t => {
  const { collectAssets } = mockModule(["foo.png", "bar.png"]);
  const config = {
    assetsPath: "app/assets/",
    replacePath: s => s.replace("app", "_app_"),
    buildUrl: (fileName, hash) => fileName.replace(/\./, "-" + hash + ".")
  };
  const expected = [
    {
      elmName: "bar_png",
      urlWithHash: "bar-HASH.png"
    },
    {
      elmName: "foo_png",
      urlWithHash: "foo-HASH.png"
    }
  ];
  const callback = (err, actual) => t.deepEqual(actual, expected);
  collectAssets(config, callback);
});

test("collectAssets should raise an error if there are duplications", t => {
  const { collectAssets } = mockModule([
    "foo.png",
    "foo.png",
    "testFile.svg",
    "test_file.svg"
  ]);
  const config = {
    assetsPath: "app/assets/",
    replacePath: s => s.replace("app", "_app_"),
    buildUrl: (fileName, hash) => fileName.replace(/\./, "-" + hash + ".")
  };
  const expected = new Error(
    `I had troubles creating a uniq \`elmName\` for: testFile_svg, testFile_svg, foo_png, foo_png.`
  );
  const callback = err => t.deepEqual(err, expected);
  collectAssets(config, callback);
});

test("copyAsset", t => {
  mock("fs-extra", {
    copySync: (s, d) => {
      t.deepEqual(s, "app/assets/foo.png");
      t.deepEqual(d, "public/test/assets/foo-hash.png");
    }
  });
  const { copyAsset } = mock.reRequire("./index.js");

  const config = {
    assetsOutputPath: "public/test"
  };
  copyAsset("app/assets/foo.png", "assets/foo-hash.png", config);
});

test("copyAsset doesn't copy if not configured", t => {
  mock("fs-extra", {
    copySync: () => t.fail()
  });
  const { copyAsset } = mock.reRequire("./index.js");

  const config = {};
  copyAsset("app/assets/foo.png", "assets/foo-hash.png", config);
  t.pass();
});
test("writeElmFile", t => {
  mock("fs-extra", {
    mkdirpSync: p => t.is(p, "src/Nri"),
    writeFile: (p, content, cb) => {
      t.is(p, "src/Nri/Assets.elm");
      t.regex(content, /img1_png : Asset/);
      t.regex(content, /img2_png : Asset/);
      t.regex(content, /Asset \"assets\/img1.png\"/);
      t.regex(content, /Asset \"assets\/img2.png\"/);
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
    { elmName: "img1_png", urlWithHash: "assets/img1.png" },
    { elmName: "img2_png", urlWithHash: "assets/img2.png" }
  ];
  const done = (err, actual) => t.is(actual, expected);
  writeElmFile(config, assets, done);
});

test("validateConfig should throw when the config isn't correct", t => {
  const config = {};
  const expected = err => {
    t.regex(err.message, /assetsPath/);
    t.regex(err.message, /outputPath/);
    t.regex(err.message, /moduleNamespace/);
    t.regex(err.message, /replacePath/);
    t.regex(err.message, /buildUrl/);
    return true;
  };
  const callback = () => t.fail();
  t.throws(() => buildElmAssets.buildElmAssets(config, callback), expected);
});

test("validateConfig shouldn't throw when config is okay", t => {
  const config = {
    assetsPath: "path",
    outputPath: "path",
    moduleNamespace: "NRI",
    replacePath: () => true,
    buildUrl: () => true
  };
  t.notThrows(() => buildElmAssets.validateConfig(config));
});
