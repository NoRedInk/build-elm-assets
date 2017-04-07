import test from "ava";
import { createElmName } from "./index.js";

test("createElmName", t => {
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
