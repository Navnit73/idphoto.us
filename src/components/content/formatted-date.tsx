const formatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

/** Content dates are calendar dates, so they're formatted in UTC to stay stable everywhere. */
export function FormattedDate({ iso }: { iso: string }) {
  return <time dateTime={iso.slice(0, 10)}>{formatter.format(new Date(iso))}</time>;
}
