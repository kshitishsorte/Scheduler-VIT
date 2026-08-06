import { MONTHS } from "@/lib/calendar";
import type { MonthCursor } from "@/lib/calendar";
import type { ThemeName } from "@/types";

interface CalendarHeaderProps {
  cursor: MonthCursor;
  countLabel: string;
  theme: ThemeName;
  onToggleTheme: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSignOut: () => void;
}

const squareButton: React.CSSProperties = {
  width: 34,
  height: 34,
  border: "1px solid var(--ink)",
  background: "transparent",
  color: "var(--ink)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const labelButton: React.CSSProperties = {
  height: 34,
  padding: "0 12px",
  border: "1px solid var(--ink)",
  background: "transparent",
  color: "var(--ink)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

export function CalendarHeader({
  cursor,
  countLabel,
  theme,
  onToggleTheme,
  onPrev,
  onNext,
  onToday,
  onSignOut,
}: CalendarHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 32,
        padding: "24px 32px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {MONTHS[cursor.month]}
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 400,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "var(--muted-2)",
          }}
        >
          {cursor.year}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--muted-1)",
            marginRight: 12,
          }}
        >
          {countLabel}
        </div>

        {/* Not in the design file, which has no account of its own - the app
            needs a way out, styled to match the toolbar it sits in. */}
        <button
          type="button"
          onClick={onSignOut}
          className="hv-invert"
          style={{ ...labelButton, marginRight: 4 }}
        >
          Sign out
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          title="Switch light / dark"
          className="hv-invert"
          style={{ ...labelButton, marginRight: 4 }}
        >
          <span
            style={{ width: 9, height: 9, background: "currentColor" }}
          />
          <span>{theme === "dark" ? "Dark" : "Light"}</span>
        </button>

        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous month"
          className="hv-invert"
          style={squareButton}
        >
          ←
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next month"
          className="hv-invert"
          style={squareButton}
        >
          →
        </button>
        <button
          type="button"
          onClick={onToday}
          className="hv-today"
          style={{
            height: 34,
            padding: "0 14px",
            border: "1px solid var(--ink)",
            background: "var(--ink)",
            color: "var(--bg)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Today
        </button>
      </div>
    </div>
  );
}
