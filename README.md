# shukujitu

Japanese public holidays as an iCalendar feed.

## Subscribe

Add the following URL to a calendar app as a subscription.

```txt
https://omochice.github.io/shukujitu/holidays.ics
```

Each holiday is an all-day event that does not mark the day as busy.

## Development

The sources are TypeScript run directly by Node.js type stripping, so there is no compile step.

```sh
pnpm install
pnpm run check  # Biome and type check with tsrs
pnpm test
pnpm run build  # writes dist/holidays.ics and dist/index.html
```

Pushing to `main` deploys `dist` to GitHub Pages through `.github/workflows/pages.yml`.
The repository's Pages source must be set to "GitHub Actions".

## Data and license

The holiday data comes from [holiday_jp](https://github.com/holiday-jp/holiday_jp), which is distributed under the MIT License and cites the [Cabinet Office](https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html) as its source.
The published calendar and page carry its copyright and license notice.

The code in this repository is licensed under the zlib License.
