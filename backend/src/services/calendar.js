import { DateTime } from "luxon";
const escape = (v) =>
  String(v || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
// RFC 5545: fold at 75 octets without splitting UTF-8 characters.
function fold(line) {
  let result = "",
    size = 0;
  for (const char of line) {
    const bytes = Buffer.byteLength(char);
    if (size + bytes > 75) {
      result += "\r\n ";
      size = 1;
    }
    result += char;
    size += bytes;
  }
  return result;
}
export function calendarFile(event, url) {
  const fmt = "yyyyMMdd'T'HHmmss'Z'";
  const timed = event.startTime && event.endTime && event.timezone;
  const dates = timed
    ? [
        `DTSTART:${DateTime.fromISO(`${event.startDate}T${event.startTime}`, { zone: event.timezone }).toUTC().toFormat(fmt)}`,
        `DTEND:${DateTime.fromISO(`${event.endDate}T${event.endTime}`, { zone: event.timezone }).toUTC().toFormat(fmt)}`,
      ]
    : [
        `DTSTART;VALUE=DATE:${event.startDate.replaceAll("-", "")}`,
        `DTEND;VALUE=DATE:${DateTime.fromISO(event.endDate).plus({ days: 1 }).toFormat("yyyyMMdd")}`,
      ];
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cultura sin fronteras//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@cultura-sin-fronteras`,
    `DTSTAMP:${DateTime.utc().toFormat(fmt)}`,
    ...dates,
    `SUMMARY:${escape((event.isDemo ? "[EJEMPLO] " : "") + event.title)}`,
    `DESCRIPTION:${escape((!event.dateConfirmed ? "Fechas no confirmadas. " : "") + event.description)}`,
    `LOCATION:${escape(`${event.venue}, ${event.city}, ${event.country}`)}`,
    `URL:${url}`,
    `STATUS:${event.dateConfirmed && !event.isDemo ? "CONFIRMED" : "TENTATIVE"}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .map(fold)
    .join("\r\n");
}
