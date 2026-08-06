import {
  dateKey,
  monthCells,
  nextMonth,
  prevMonth,
  groupByDate,
  gridRange,
  weekdayLabels,
} from "../src/lib/calendar.ts";

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

console.log("\nGrid is always 42 cells and never drops a day");
for (const [year, month, label] of [
  [2026, 7, "Aug 2026 (starts Sat, 31 days — needs 6 rows)"],
  [2026, 1, "Feb 2026 (starts Sun)"],
  [2024, 1, "Feb 2024 (leap)"],
  [2026, 4, "May 2026"],
  [2027, 4, "May 2027 (starts Sat, 31 days)"],
] as const) {
  const cells = monthCells({ year, month });
  const inMonth = cells.filter((d) => d.getMonth() === month);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  check(`${label}: 42 cells`, cells.length, 42);
  check(`${label}: all ${daysInMonth} days`, inMonth.length, daysInMonth);
  check(`${label}: starts Sunday`, cells[0]!.getDay(), 0);
}

console.log("\nYear boundaries — the old code wrapped back into the same year");
check("Dec 2026 -> next", nextMonth({ year: 2026, month: 11 }), { year: 2027, month: 0 });
check("Jan 2026 -> prev", prevMonth({ year: 2026, month: 0 }), { year: 2025, month: 11 });
{
  const jan2027 = monthCells({ year: 2027, month: 0 });
  check("Jan 2027 grid opens in Dec 2026", dateKey(jan2027[0]!), "2026-12-27");
  check("Jan 2027 has 2027-01-01", jan2027.some((d) => dateKey(d) === "2027-01-01"), true);
  check("Dec 2026 has 2026-12-31", monthCells({ year: 2026, month: 11 }).some((d) => dateKey(d) === "2026-12-31"), true);
}

console.log("\ndateKey stays local — never UTC-shifted to the wrong day");
check("midnight", dateKey(new Date(2026, 0, 1, 0, 0, 0)), "2026-01-01");
check("23:59", dateKey(new Date(2026, 0, 1, 23, 59, 59)), "2026-01-01");
check("zero-padded", dateKey(new Date(2026, 7, 6)), "2026-08-06");

console.log("\nDST months keep 42 distinct days");
for (const [year, month, label] of [
  [2026, 2, "Mar 2026 (spring forward)"],
  [2026, 9, "Oct 2026 (EU fall back)"],
  [2026, 10, "Nov 2026 (US fall back)"],
] as const) {
  const keys = monthCells({ year, month }).map(dateKey);
  check(`${label}`, new Set(keys).size, 42);
}

console.log("\ngridRange and weekdayLabels");
check("Aug 2026 range", gridRange(monthCells({ year: 2026, month: 7 })), {
  from: "2026-07-26",
  to: "2026-09-05",
});
check("Sunday start", weekdayLabels(0)[0], "Sun");
check("Monday start", weekdayLabels(1), ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

console.log("\ngroupByDate — timed tasks in clock order, untimed last");
{
  const t = (id: string, date: string, time: string) => ({
    id, title: id, date, time, priority: "normal" as const, done: false,
  });
  const grouped = groupByDate([
    t("late", "2026-08-06", "21:00"),
    t("none", "2026-08-06", ""),
    t("early", "2026-08-06", "08:00"),
    t("next", "2026-08-07", ""),
  ]);
  check("order", grouped.get("2026-08-06")!.map((x) => x.title), ["early", "late", "none"]);
  check("separate days", grouped.get("2026-08-07")!.length, 1);
}

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
