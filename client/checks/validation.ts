import {
  parseTime,
  parseTitle,
  parseEmail,
  parsePassword,
  parseName,
  parseDate,
} from "../src/lib/validation.ts";

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) console.log(`  ok   ${name}`);
  else {
    failures++;
    console.log(`  FAIL ${name}\n       expected ${e}\n       actual   ${a}`);
  }
}
const val = (r: ReturnType<typeof parseTime>) =>
  r.ok ? r.value : `ERR: ${r.error}`;

/** Read from the source so these cannot drift from the real messages. */
const HOURS_ERR = val(parseTime("24"));
const MINUTES_ERR = val(parseTime("0060"));
const SHAPE_ERR = val(parseTime("abc"));

console.log("\nparseTime accepts what people actually type");
for (const [input, expected] of [
  ["", ""], ["9", "09:00"], ["09", "09:00"], ["930", "09:30"],
  ["9:30", "09:30"], ["09:30", "09:30"], ["0930", "09:30"],
  ["2145", "21:45"], ["21:45", "21:45"], ["0", "00:00"],
  ["0000", "00:00"], ["00:00", "00:00"], ["2359", "23:59"],
  ["23:59", "23:59"], ["  930  ", "09:30"],
] as const) check(`"${input}"`, val(parseTime(input)), expected);

console.log("\nHours must be under 24");
for (const input of ["24", "2400", "24:00", "25:30", "99", "9900"]) {
  check(`"${input}" rejected`, val(parseTime(input)), HOURS_ERR);
}
check("message names hours", HOURS_ERR.includes("Hours"), true);

console.log("\nMinutes must be under 60");
for (const input of ["0060", "00:60", "1099", "10:99", "975", "23:60"]) {
  check(`"${input}" rejected`, val(parseTime(input)), MINUTES_ERR);
}
check("message names minutes", MINUTES_ERR.includes("Minutes"), true);

console.log("\nMalformed input is rejected, not silently discarded");
for (const input of ["abc", "9:3:0", ":", "-5", "1 30", "12345"]) {
  check(`"${input}"`, val(parseTime(input)), SHAPE_ERR);
}

console.log("\nparseTitle");
check("trims", val(parseTitle("  Standup  ")), "Standup");
check("empty rejected", parseTitle("   ").ok, false);
check("200 chars ok", parseTitle("x".repeat(200)).ok, true);
check("201 chars rejected", parseTitle("x".repeat(201)).ok, false);

console.log("\nparseEmail");
check("normalises", val(parseEmail("  Kshitish@VIT.ac.in ")), "kshitish@vit.ac.in");
for (const input of ["nope", "a@b", "@b.com", "a@.com", "a b@c.com", ""]) {
  check(`"${input}" rejected`, parseEmail(input).ok, false);
}

console.log("\nparsePassword");
check("8 chars ok", parsePassword("12345678").ok, true);
check("7 chars rejected", parsePassword("1234567").ok, false);
check("128 chars ok", parsePassword("x".repeat(128)).ok, true);
check("129 chars rejected", parsePassword("x".repeat(129)).ok, false);

console.log("\nparseName");
check("trims", val(parseName("  Kshitish ", "First name")), "Kshitish");
check("empty rejected", parseName("", "First name").ok, false);
check("60 chars ok", parseName("x".repeat(60), "First name").ok, true);
check("61 chars rejected", parseName("x".repeat(61), "First name").ok, false);

console.log("\nparseDate rejects dates that do not exist");
check("2026-08-06", parseDate("2026-08-06").ok, true);
check("2024-02-29 leap", parseDate("2024-02-29").ok, true);
for (const input of ["2026-02-29", "2026-02-30", "2026-13-01", "2026-04-31", "2026-00-10"]) {
  check(`${input} rejected`, parseDate(input).ok, false);
}
check("06-08-2026 wrong shape", parseDate("06-08-2026").ok, false);

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
