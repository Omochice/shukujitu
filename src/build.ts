import { mkdir, readFile, writeFile } from "node:fs/promises";
import holiday_jp from "@holiday-jp/holiday_jp";
import { toICalendar } from "./ics.ts";

const outDir = new URL("../dist/", import.meta.url);

const holidays = Object.values(holiday_jp.holidays).sort((a, b) =>
  a.date.localeCompare(b.date),
);

const licenseText = await readFile(
  new URL(
    "LICENSE",
    import.meta.resolve("@holiday-jp/holiday_jp/package.json"),
  ),
  "utf8",
);

// Failing the build is preferable to publishing a calendar without its required notice.
const copyright = licenseText.match(/^Copyright .*$/m)?.[0];
if (copyright === undefined) {
  throw new Error("No copyright line found in the holiday_jp LICENSE");
}

const ics = toICalendar(holidays, {
  calendarName: "日本の祝日",
  dtstamp: new Date(),
  description: `祝日データ：holiday_jp（MIT License, ${copyright}）https://github.com/holiday-jp/holiday_jp`,
});

await mkdir(outDir, { recursive: true });
await writeFile(new URL("holidays.ics", outDir), ics);
