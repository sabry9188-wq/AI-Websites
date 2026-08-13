/** Today's date in Gulf Standard Time (Asia/Dubai, UTC+04:00), as
 * YYYY-MM-DD — never the browser's local date. Net date math is always GST
 * (see supabase/schema.sql); this is the client-side equivalent of the
 * server's `(now() at time zone 'Asia/Dubai')::date`, used to default and
 * cap date pickers so they agree with what the RPCs will actually accept. */
export function gstToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}
