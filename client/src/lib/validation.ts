/**
 * Input rules, mirrored from the server's zod schemas.
 *
 * The server is the authority - it re-checks everything and never trusts these.
 * These exist so a mistake is caught while the user is still looking at the
 * field, with a message that says what is actually wrong, rather than coming
 * back as a generic failure after a round trip.
 */

export const LIMITS = {
  titleMax: 200,
  nameMax: 60,
  emailMax: 254,
  passwordMin: 8,
  passwordMax: 128,
} as const;

export type Check<T = string> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const ok = <T,>(value: T): Check<T> => ({ ok: true, value });
const bad = (error: string): Check<never> => ({ ok: false, error });

/**
 * Parses a 24-hour time.
 *
 * Accepts what people actually type - "9", "930", "9:30", "0930" - and rejects
 * anything out of range with a message naming the offending part. An empty
 * value is valid and means "no time set".
 */
export function parseTime(raw: string): Check<string> {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return ok("");

  if (!/^[0-9]{1,2}[:.]?[0-9]{0,2}$/.test(trimmed)) {
    return bad("Enter a time like 9:30 or 0930");
  }

  const digits = trimmed.replace(/[^0-9]/g, "");
  if (digits.length === 0) return bad("Enter a time like 9:30 or 0930");
  if (digits.length > 4) return bad("Too many digits — use HH:MM");

  let hours: number;
  let minutes: number;

  if (digits.length <= 2) {
    // A bare number is an hour: "9" is 09:00, not 00:09.
    hours = Number(digits);
    minutes = 0;
  } else if (digits.length === 3) {
    hours = Number(digits.slice(0, 1));
    minutes = Number(digits.slice(1));
  } else {
    hours = Number(digits.slice(0, 2));
    minutes = Number(digits.slice(2, 4));
  }

  if (hours > 23) return bad("Hours must be 00–23");
  if (minutes > 59) return bad("Minutes must be 00–59");

  return ok(
    `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
  );
}

export function parseTitle(raw: string): Check<string> {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return bad("Give the task a name");
  if (trimmed.length > LIMITS.titleMax) {
    return bad(`Keep it under ${LIMITS.titleMax} characters`);
  }
  return ok(trimmed);
}

export function parseName(raw: string, field: string): Check<string> {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return bad(`${field} is required`);
  if (trimmed.length > LIMITS.nameMax) {
    return bad(`${field} must be under ${LIMITS.nameMax} characters`);
  }
  return ok(trimmed);
}

export function parseEmail(raw: string): Check<string> {
  const trimmed = String(raw ?? "").trim().toLowerCase();
  if (!trimmed) return bad("Email is required");
  if (trimmed.length > LIMITS.emailMax) return bad("That email is too long");
  // Deliberately loose: one @, something either side, a dot in the domain.
  // Anything stricter starts rejecting addresses that are actually valid.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return bad("Enter a valid email address");
  }
  return ok(trimmed);
}

export function parsePassword(raw: string): Check<string> {
  const value = String(raw ?? "");
  if (!value) return bad("Password is required");
  if (value.length < LIMITS.passwordMin) {
    return bad(`Use at least ${LIMITS.passwordMin} characters`);
  }
  if (value.length > LIMITS.passwordMax) {
    return bad(`Use at most ${LIMITS.passwordMax} characters`);
  }
  return ok(value);
}

/** `YYYY-MM-DD`, and a date that actually exists (rejects 2026-02-30). */
export function parseDate(raw: string): Check<string> {
  const trimmed = String(raw ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return bad("Date must be formatted YYYY-MM-DD");
  }

  const [year, month, day] = trimmed.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const date = new Date(year, month - 1, day);
  const real =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return real ? ok(trimmed) : bad("That date does not exist");
}
