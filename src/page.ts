import van from "mini-van-plate/van-plate";

/** Inputs for {@link renderIndexPage}. */
export interface IndexPageOptions {
  /** Full license text of the holiday data, shown verbatim. */
  licenseText: string;
}

/**
 * Renders the landing page that describes the calendar and credits its data.
 * @returns The HTML document.
 */
export function renderIndexPage({ licenseText }: IndexPageOptions): string {
  const { a, body, h1, h2, head, meta, p, pre, title } = van.tags;
  return van.html(
    { lang: "ja" },
    head(
      meta({ charset: "utf-8" }),
      meta({
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      }),
      title("日本の祝日カレンダー"),
    ),
    body(
      h1("日本の祝日カレンダー"),
      p(a({ href: "holidays.ics" }, "holidays.ics")),
      h2("Data source and license"),
      p(
        "祝日データ: ",
        a({ href: "https://github.com/holiday-jp/holiday_jp" }, "holiday_jp"),
      ),
      pre(licenseText.trim()),
      p(
        "holiday_jpの出典: ",
        a(
          { href: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
          "内閣府ホームページ",
        ),
      ),
    ),
  );
}
