import assert from "node:assert/strict";
import { test } from "node:test";
import { foldLine, toICalendar } from "./ics.ts";

const dtstamp = new Date(Date.UTC(2026, 0, 2, 3, 4, 5));
const options = { calendarName: "日本の祝日", dtstamp };

const unfold = (text: string) => text.replaceAll("\r\n ", "");

test("wraps events in a VCALENDAR with the required properties and CRLF endings", () => {
  const ics = toICalendar([], options);
  assert.equal(
    ics,
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//shukujitu//Japanese Holidays//JA",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:日本の祝日",
      "X-WR-TIMEZONE:Asia/Tokyo",
      "END:VCALENDAR",
      "",
    ].join("\r\n"),
  );
});

test("uses only CRLF as line terminator", () => {
  const ics = toICalendar([{ date: "2026-01-01", name: "元日" }], options);
  assert.equal(ics.replaceAll("\r\n", "").includes("\n"), false);
  assert.equal(ics.replaceAll("\r\n", "").includes("\r"), false);
  assert.ok(ics.endsWith("\r\n"));
});

test("renders a single holiday as an all-day transparent event", () => {
  const ics = toICalendar([{ date: "2026-01-01", name: "元日" }], options);
  const expected = [
    "BEGIN:VEVENT",
    "UID:20260101@shukujitu",
    "DTSTAMP:20260102T030405Z",
    "DTSTART;VALUE=DATE:20260101",
    "DTEND;VALUE=DATE:20260102",
    "SUMMARY:元日",
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  ].join("\r\n");
  assert.ok(ics.includes(expected));
});

test("DTEND rolls over a month boundary", () => {
  const ics = toICalendar([{ date: "2026-04-30", name: "x" }], options);
  assert.ok(ics.includes("DTEND;VALUE=DATE:20260501\r\n"));
});

test("DTEND rolls over a year boundary", () => {
  const ics = toICalendar([{ date: "2026-12-31", name: "x" }], options);
  assert.ok(ics.includes("DTEND;VALUE=DATE:20270101\r\n"));
});

test("DTEND accounts for a leap day", () => {
  const ics = toICalendar([{ date: "2028-02-28", name: "x" }], options);
  assert.ok(ics.includes("DTEND;VALUE=DATE:20280229\r\n"));
});

test("escapes backslash, semicolon, comma and newline in SUMMARY", () => {
  const ics = toICalendar(
    [{ date: "2026-01-01", name: "a\\b;c,d\ne" }],
    options,
  );
  assert.ok(ics.includes("SUMMARY:a\\\\b\\;c\\,d\\ne\r\n"));
});

test("formats DTSTAMP in UTC with zero padding", () => {
  const stamp = new Date(Date.UTC(2030, 8, 7, 1, 2, 3));
  const ics = toICalendar([{ date: "2026-01-01", name: "x" }], {
    ...options,
    dtstamp: stamp,
  });
  assert.ok(ics.includes("DTSTAMP:20300907T010203Z\r\n"));
});

test("emits events in the given order", () => {
  const ics = toICalendar(
    [
      { date: "2026-01-01", name: "a" },
      { date: "2026-01-12", name: "b" },
    ],
    options,
  );
  assert.ok(ics.indexOf("UID:20260101@") < ics.indexOf("UID:20260112@"));
});

test("folds a long multibyte SUMMARY into lines of at most 75 octets", () => {
  const name = "国民の祝日".repeat(20);
  const ics = toICalendar([{ date: "2026-01-01", name }], options);
  for (const line of ics.split("\r\n")) {
    assert.ok(Buffer.byteLength(line, "utf8") <= 75, line);
  }
  assert.ok(ics.includes("\r\n "));
});

test("unfolding a folded SUMMARY restores the original text", () => {
  const name = "国民の祝日".repeat(20);
  const ics = toICalendar([{ date: "2026-01-01", name }], options);
  assert.ok(unfold(ics).includes(`SUMMARY:${name}\r\n`));
});

test("folding never splits a multibyte character", () => {
  const folded = foldLine(`SUMMARY:${"あ😀".repeat(30)}`);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (const line of folded.split("\r\n")) {
    assert.doesNotThrow(() => decoder.decode(Buffer.from(line, "utf8")));
    assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  }
  assert.equal(unfold(folded), `SUMMARY:${"あ😀".repeat(30)}`);
});

test("folding leaves a short line unchanged", () => {
  assert.equal(foldLine("SUMMARY:元日"), "SUMMARY:元日");
});

test("folding counts the leading space of continuation lines toward the limit", () => {
  const folded = foldLine(`X:${"a".repeat(200)}`);
  const lines = folded.split("\r\n");
  assert.equal(Buffer.byteLength(lines[0], "utf8"), 75);
  assert.equal(Buffer.byteLength(lines[1], "utf8"), 75);
  assert.ok(lines[1].startsWith(" "));
});

test("adds an escaped X-WR-CALDESC after the calendar name when a description is given", () => {
  const ics = toICalendar([], { ...options, description: "a,b;c" });
  assert.ok(
    ics.includes("X-WR-CALNAME:日本の祝日\r\nX-WR-CALDESC:a\\,b\\;c\r\n"),
  );
});

test("omits X-WR-CALDESC when no description is given", () => {
  assert.equal(toICalendar([], options).includes("X-WR-CALDESC"), false);
});
