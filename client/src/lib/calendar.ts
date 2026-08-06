import type { Task } from "@/types";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const WEEKDAY_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** The design's grid is always 6 rows of 7. */
export const GRID_CELLS = 42;

export interface MonthCursor {
  year: number;
  /** 0-11. */
  month: number;
}

/**
 * `YYYY-MM-DD` for a local date.
 *
 * Deliberately not `toISOString()`: that converts to UTC first, so any user
 * east or west of UTC would get the previous or next day for dates near
 * midnight. Reading the local parts keeps the key on the day the user sees.
 */
export function dateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function currentMonth(): MonthCursor {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

/**
 * The 42 dates of the month grid, starting on the first `weekStart` on or
 * before the 1st.
 *
 * `new Date(year, month, 1 - lead + i)` intentionally relies on the Date
 * constructor normalising out-of-range days, which is what makes the leading
 * and trailing days roll into the neighbouring months (and years) correctly.
 */
export function monthCells(
  cursor: MonthCursor,
  weekStartsOn: 0 | 1 = 0,
): Date[] {
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const lead = (firstWeekday - weekStartsOn + 7) % 7;

  return Array.from(
    { length: GRID_CELLS },
    (_, i) => new Date(cursor.year, cursor.month, 1 - lead + i),
  );
}

/** Weekday headings, rotated to match `weekStartsOn`. */
export function weekdayLabels(weekStartsOn: 0 | 1 = 0): string[] {
  const labels = [...WEEKDAY_SHORT];
  return weekStartsOn === 1 ? [...labels.slice(1), labels[0]!] : labels;
}

export function prevMonth(cursor: MonthCursor): MonthCursor {
  return cursor.month === 0
    ? { year: cursor.year - 1, month: 11 }
    : { year: cursor.year, month: cursor.month - 1 };
}

export function nextMonth(cursor: MonthCursor): MonthCursor {
  return cursor.month === 11
    ? { year: cursor.year + 1, month: 0 }
    : { year: cursor.year, month: cursor.month + 1 };
}

/** Inclusive `YYYY-MM-DD` bounds of the visible grid, for the list request. */
export function gridRange(cells: Date[]): { from: string; to: string } {
  return {
    from: dateKey(cells[0]!),
    to: dateKey(cells[cells.length - 1]!),
  };
}

/** Groups tasks by their date key so each cell is one lookup, not a scan. */
export function groupByDate(tasks: Task[]): Map<string, Task[]> {
  const byDate = new Map<string, Task[]>();

  for (const task of tasks) {
    const bucket = byDate.get(task.date);
    if (bucket) {
      bucket.push(task);
    } else {
      byDate.set(task.date, [task]);
    }
  }

  // Timed tasks in clock order, untimed ones last - matching how the day
  // modal reads top to bottom.
  for (const bucket of byDate.values()) {
    bucket.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  }

  return byDate;
}

export function pluralTasks(count: number): string {
  return `${count} ${count === 1 ? "task" : "tasks"}`;
}
