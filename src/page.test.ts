import assert from "node:assert/strict";
import { test } from "node:test";
import { renderIndexPage } from "./page.ts";

const licenseText = `MIT License

Copyright (c) 2016 holiday-jp

THE SOFTWARE IS PROVIDED "AS IS" & <WITHOUT> WARRANTY`;

test("links to the calendar file", () => {
  assert.ok(
    renderIndexPage({ licenseText }).includes('<a href="holidays.ics">'),
  );
});

test("embeds the holiday data license text with HTML escaped", () => {
  const html = renderIndexPage({ licenseText });
  assert.ok(html.includes("Copyright (c) 2016 holiday-jp"));
  assert.ok(html.includes("&amp; &lt;WITHOUT&gt; WARRANTY"));
  assert.equal(html.includes("<WITHOUT>"), false);
});

test("credits holiday_jp and the Cabinet Office as data sources", () => {
  const html = renderIndexPage({ licenseText });
  assert.ok(html.includes("https://github.com/holiday-jp/holiday_jp"));
  assert.ok(
    html.includes("https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html"),
  );
});
