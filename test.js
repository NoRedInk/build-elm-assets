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

function mockModule() {
  mock("dive", function(path, cb, done) {
    ["foo.png", "bar.png"].map(i => cb(null, i));
    done();
  });
  mock("md5-file", { sync: () => "HASH" });
  return mock.reRequire("./index.js");
}
test("collectAssets", t => {
  const { collectAssets } = mockModule();
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
