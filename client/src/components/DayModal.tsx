import { useState } from "react";
import { dotColor } from "./TaskChip";
import { MONTHS, WEEKDAY_LONG, pluralTasks } from "@/lib/calendar";
import { parseTime, parseTitle } from "@/lib/validation";
import type { Task, TaskInput } from "@/types";

interface DayModalProps {
  date: Date;
  dateKey: string;
  tasks: Task[];
  onClose: () => void;
  onToggleDone: (task: Task) => void;
  onAdd: (input: TaskInput) => void;
}

/** The expanded view of a single day, opened by clicking its date. */
export function DayModal({
  date,
  dateKey,
  tasks,
  onClose,
  onToggleDone,
  onAdd,
}: DayModalProps) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");

  const titleCheck = parseTitle(title);
  const timeCheck = parseTime(time);
  // An untouched, empty row is a cancel, not an error to complain about.
  const problem = title.trim() === "" && time.trim() === ""
    ? null
    : !titleCheck.ok
      ? titleCheck.error
      : !timeCheck.ok
        ? timeCheck.error
        : null;

  const close = () => {
    setAdding(false);
    setTitle("");
    setTime("");
  };

  const commit = () => {
    if (!title.trim() && !time.trim()) {
      close();
      return;
    }
    // Stay open on invalid input so the reason remains on screen.
    if (!titleCheck.ok || !timeCheck.ok) return;

    onAdd({
      title: titleCheck.value,
      date: dateKey,
      time: timeCheck.value,
      priority: "normal",
      done: false,
    });
    close();
  };

  return (
    <div
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onClose}
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        background: "var(--veil)",
        backdropFilter: "blur(10px) saturate(0.9)",
        WebkitBackdropFilter: "blur(10px) saturate(0.9)",
        animation: "dayVeil 200ms cubic-bezier(.2,.8,.2,1) both",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Tasks for ${date.getDate()} ${MONTHS[date.getMonth()]}`}
        style={{
          width: 520,
          maxWidth: "100%",
          maxHeight: "100%",
          overflow: "auto",
          background: "var(--raised)",
          border: "2px solid var(--ink)",
          boxShadow: "0 12px 32px var(--shadow-lg-color)",
          padding: "28px 28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          cursor: "default",
          animation: "dayCard 260ms cubic-bezier(.2,.8,.2,1) both",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--muted-1)",
              }}
            >
              {WEEKDAY_LONG[date.getDay()]}
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {date.getDate()} {MONTHS[date.getMonth()]}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flex: "none" }}>
            <button
              type="button"
              onClick={() => setAdding(true)}
              title="Add a task to this day"
              className="hv-today"
              style={{
                width: 32,
                height: 32,
                border: "1px solid var(--ink)",
                background: "var(--ink)",
                color: "var(--bg)",
                fontSize: 17,
                lineHeight: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              +
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="hv-accent-fill"
              style={{
                width: 32,
                height: 32,
                border: "1px solid var(--ink)",
                background: "transparent",
                color: "var(--ink)",
                fontSize: 16,
                lineHeight: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ height: 2, background: "var(--ink)" }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            background: "var(--line-soft)",
          }}
        >
          {tasks.map((task) => (
            <div
              key={task.id}
              className="hv-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                minWidth: 0,
                background: "var(--raised)",
                padding: "12px 4px",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  flex: "none",
                  background: dotColor(task),
                }}
              />
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  flex: 1,
                  minWidth: 0,
                  color: task.done ? "var(--muted-2)" : "var(--ink)",
                  textDecoration: task.done ? "line-through" : "none",
                }}
              >
                {task.title}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--muted-1)",
                  flex: "none",
                  letterSpacing: "0.02em",
                }}
              >
                {task.time || "—"}
              </span>
              <button
                type="button"
                onClick={() => onToggleDone(task)}
                className="hv-accent-edge"
                style={{
                  border: "1px solid var(--line)",
                  background: "transparent",
                  color: "var(--muted-1)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "5px 8px",
                  cursor: "pointer",
                  flex: "none",
                }}
              >
                {task.done ? "Undo" : "Done"}
              </button>
            </div>
          ))}

          {adding && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                background: "var(--field)",
                boxShadow: "inset 0 0 0 1px var(--accent)",
                padding: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minWidth: 0,
                }}
              >
              <span
                style={{
                  width: 7,
                  height: 7,
                  flex: "none",
                  background: "var(--accent)",
                }}
              />
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commit();
                  if (event.key === "Escape") close();
                }}
                autoFocus
                placeholder="New task"
                aria-label="New task title"
                aria-invalid={Boolean(title.trim()) && !titleCheck.ok}
                maxLength={200}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  background: "transparent",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--ink)",
                  padding: 0,
                  outline: "none",
                }}
              />
              <input
                value={time}
                onChange={(event) => setTime(event.target.value)}
                onBlur={() => {
                  // Tidy only when it parsed; a bad value stays visible.
                  if (timeCheck.ok) setTime(timeCheck.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commit();
                  if (event.key === "Escape") close();
                }}
                placeholder="HH:MM"
                maxLength={5}
                inputMode="numeric"
                aria-label="Time, 24 hour"
                aria-invalid={!timeCheck.ok}
                style={{
                  width: 64,
                  flex: "none",
                  border: `1px solid ${timeCheck.ok ? "var(--line)" : "var(--accent)"}`,
                  background: "var(--field)",
                  fontSize: 12,
                  fontWeight: 500,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--ink)",
                  padding: "5px 7px",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={commit}
                disabled={Boolean(problem)}
                className={problem ? undefined : "hv-accent-bg"}
                style={{
                  border: "none",
                  background: "var(--ink)",
                  color: "var(--bg)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "7px 10px",
                  cursor: problem ? "not-allowed" : "pointer",
                  opacity: problem ? 0.45 : 1,
                  flex: "none",
                }}
              >
                Add
              </button>
              </div>

              {problem && (
                <div
                  role="alert"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--accent)",
                    paddingLeft: 19,
                  }}
                >
                  {problem}
                </div>
              )}
            </div>
          )}

          {tasks.length === 0 && !adding && (
            <div
              style={{
                background: "var(--raised)",
                padding: "16px 4px",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--muted-2)",
              }}
            >
              Nothing scheduled. Drag across the day to add something.
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            paddingTop: 2,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--muted-1)",
            }}
          >
            {pluralTasks(tasks.length)}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hv-accent-bg"
            style={{
              border: "none",
              background: "var(--ink)",
              color: "var(--bg)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "10px 16px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            Back to month
          </button>
        </div>
      </div>
    </div>
  );
}
