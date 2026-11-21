const MAX_OCTETS = 75;

/** A single holiday. */
export interface Holiday {
  /** Calendar date as `YYYY-MM-DD`. */
  date: string;
  /** Display name. */
  name: string;
}

/** Options for {@link toICalendar}. */
export interface ICalendarOptions {
  /** Name shown by calendar clients. */
  calendarName: string;
  /** Creation time stamped on every event. */
  dtstamp: Date;
  /** Free-form calendar description, such as attribution of the data. */
  description?: string;
}

/**
 * Folds a content line so that no physical line exceeds 75 octets (RFC 5545 section 3.1).
 * @param line A logical line without a line terminator.
 * @returns The folded line, joined with CRLF.
 */
export function foldLine(line: string): string {
  const physical: string[] = [];
  let current = "";
  let used = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char, "utf8");
    // Continuation lines carry a leading space that counts toward the limit.
    if (used + size > MAX_OCTETS) {
      physical.push(current);
      current = ` ${char}`;
      used = 1 + size;
    } else {
      current += char;
      used += size;
    }
  }
  physical.push(current);
  return physical.join("\r\n");
}

const escapeText = (text: string): string =>
  text
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll(/\r\n|\r|\n/g, "\\n");

const formatDate = (date: Date): string =>
  [
    String(date.getUTCFullYear()).padStart(4, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");

const formatDateTime = (date: Date): string => {
  const time = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join("");
  return `${formatDate(date)}T${time}Z`;
};

/** @returns Basic-format start date and the following day. */
const dayRange = (date: string): { start: string; end: string } => {
  const [year, month, day] = date.split("-").map(Number);
  return {
    start: formatDate(new Date(Date.UTC(year, month - 1, day))),
    end: formatDate(new Date(Date.UTC(year, month - 1, day + 1))),
  };
};

const eventLines = ({ date, name }: Holiday, dtstamp: Date): string[] => {
  const { start, end } = dayRange(date);
  return [
    "BEGIN:VEVENT",
    `UID:${start}@shukujitu`,
    `DTSTAMP:${formatDateTime(dtstamp)}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeText(name)}`,
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  ];
};

/**
 * Renders holidays as an iCalendar document of all-day events.
 * @param holidays Holidays in the order they should appear.
 * @returns The document, CRLF-terminated.
 */
export function toICalendar(
  holidays: Iterable<Holiday>,
  { calendarName, dtstamp, description }: ICalendarOptions,
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//shukujitu//Japanese Holidays//JA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    ...(description === undefined
      ? []
      : [`X-WR-CALDESC:${escapeText(description)}`]),
    "X-WR-TIMEZONE:Asia/Tokyo",
    ...Array.from(holidays, (holiday) => eventLines(holiday, dtstamp)).flat(),
    "END:VCALENDAR",
  ];
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
