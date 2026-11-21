import { mkdir, writeFile } from "node:fs/promises";
import holiday_jp from "@holiday-jp/holiday_jp";
import { toICalendar } from "./ics.ts";

const outDir = new URL("../dist/", import.meta.url);

const holidays = Object.values(holiday_jp.holidays).sort((a, b) =>
  a.date.localeCompare(b.date),
);

const ics = toICalendar(holidays, {
  calendarName: "日本の祝日",
  dtstamp: new Date(),
});

await mkdir(outDir, { recursive: true });
await writeFile(new URL("holidays.ics", outDir), ics);
