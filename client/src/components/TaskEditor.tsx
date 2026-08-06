import { parseTime, parseTitle } from "@/lib/validation";
import type { Task, TaskPatch, TaskPriority } from "@/types";

/** "done" is a state of the task, not a fourth priority - see `EditingDraft`. */
export type EditorMode = TaskPriority | "done";

/**
 * The in-flight edit.
 *
 * Held by the scheduler rather than by the editor component, because the editor
 * can be closed by things it never sees - a drag starting, a press on another
 * cell, paging to the next month. Owning the draft one level up means those
 * paths all commit through `closeEditor` instead of losing the edit on unmount.
 */
export interface EditingDraft {
  task: Task;
  title: string;
  time: string;
  mode: EditorMode;
  /**
   * The other tasks created by the same drag-across-days gesture.
   *
   * A span creates one task per day, and the editor that opens straight after
   * stands for the whole gesture - so a time typed there belongs on every day
   * of the span, not only the one the popover happens to sit on.
   */
  siblingIds: string[];
}

export function draftFor(task: Task, siblingIds: string[] = []): EditingDraft {
  return {
    task,
    title: task.title,
    time: task.time,
    mode: task.done ? "done" : task.priority,
    siblingIds,
  };
}

/** Every task this edit applies to: the one shown, plus any span siblings. */
export function draftTargets(draft: EditingDraft): string[] {
  return [draft.task.id, ...draft.siblingIds];
}

/**
 * Only the fields that actually changed, so a no-op close sends no request.
 *
 * An invalid time is left out rather than blocking the whole commit - the field
 * shows the reason while the editor is open, and a dismissal keeps the previous
 * time instead of discarding the rest of the edit.
 */
export function draftPatch(draft: EditingDraft): TaskPatch {
  const { task } = draft;
  const patch: TaskPatch = {};

  const title = parseTitle(draft.title);
  if (title.ok && title.value !== task.title) patch.title = title.value;

  const time = parseTime(draft.time);
  if (time.ok && time.value !== task.time) patch.time = time.value;

  if (draft.mode === "done") {
    if (!task.done) patch.done = true;
  } else {
    if (task.done) patch.done = false;
    if (task.priority !== draft.mode) patch.priority = draft.mode;
  }

  return patch;
}

/** The first problem stopping this edit from being saved, if any. */
export function draftError(draft: EditingDraft): string | null {
  const title = parseTitle(draft.title);
  if (!title.ok) return title.error;

  const time = parseTime(draft.time);
  if (!time.ok) return time.error;

  return null;
}

interface TaskEditorProps {
  draft: EditingDraft;
  onChange: (patch: Partial<Omit<EditingDraft, "task" | "siblingIds">>) => void;
  onClose: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function TaskEditor({
  draft,
  onChange,
  onClose,
  onCancel,
  onDelete,
}: TaskEditorProps) {
  const titleCheck = parseTitle(draft.title);
  const timeCheck = parseTime(draft.time);
  const problem = draftError(draft);
  const spanCount = draft.siblingIds.length + 1;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // Refuse to close on invalid input so the message stays visible.
      if (!problem) onClose();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  const segment = (value: EditorMode, label: string) => {
    const active = draft.mode === value;
    const background = active
      ? value === "high"
        ? "var(--accent)"
        : value === "normal"
          ? "var(--ink)"
          : "var(--muted-3)"
      : "var(--raised)";
    const color = active
      ? value === "high"
        ? "#ffffff"
        : value === "normal"
          ? "var(--bg)"
          : "var(--ink)"
      : "var(--muted-1)";

    return (
      <button
        type="button"
        onClick={() => onChange({ mode: value })}
        aria-pressed={active}
        style={{
          flex: 1,
          border: "none",
          padding: "6px 8px",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: "pointer",
          textAlign: "left",
          transition: "background 150ms cubic-bezier(.2,.8,.2,1)",
          background,
          color,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        position: "absolute",
        top: -5,
        left: -7,
        width: "calc(100% + 14px)",
        minWidth: 210,
        background: "var(--raised)",
        boxShadow: "0 12px 32px var(--shadow-lg-color)",
        border: "1px solid var(--ink)",
        padding: 10,
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        gap: 9,
        cursor: "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
        <input
          value={draft.title}
          onChange={(event) => onChange({ title: event.target.value })}
          onKeyDown={onKeyDown}
          autoFocus
          aria-label="Task title"
          aria-invalid={!titleCheck.ok}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            borderBottom: `1px solid ${titleCheck.ok ? "var(--line)" : "var(--accent)"}`,
            background: "transparent",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--ink)",
            padding: "0 0 6px",
            outline: "none",
          }}
        />
        {/* Says plainly that this edit lands on more than one day. */}
        {spanCount > 1 && (
          <span
            title={`Applies to all ${spanCount} days of this span`}
            style={{
              flex: "none",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--accent)",
              paddingBottom: 7,
            }}
          >
            ×{spanCount}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--muted-1)",
            width: 36,
          }}
        >
          24h
        </span>
        <input
          value={draft.time}
          onChange={(event) => onChange({ time: event.target.value })}
          onBlur={() => {
            // Tidy "930" into "09:30" once the field is left, but only when it
            // parsed - a bad value stays put so the user can see and fix it.
            if (timeCheck.ok) onChange({ time: timeCheck.value });
          }}
          onKeyDown={onKeyDown}
          placeholder="HH:MM"
          maxLength={5}
          inputMode="numeric"
          aria-label="Time, 24 hour"
          aria-invalid={!timeCheck.ok}
          style={{
            flex: 1,
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
      </div>

      {problem && (
        <div
          role="alert"
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            lineHeight: 1.3,
            color: "var(--accent)",
            marginTop: -3,
          }}
        >
          {problem}
        </div>
      )}

      <div style={{ display: "flex", gap: 1, background: "var(--line)" }}>
        {segment("high", "Priority")}
        {segment("normal", "Normal")}
        {segment("done", "Done")}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 1 }}>
        <button
          type="button"
          onClick={() => {
            if (!problem) onClose();
          }}
          disabled={Boolean(problem)}
          className={problem ? undefined : "hv-accent-bg"}
          style={{
            flex: 1,
            border: "none",
            background: "var(--ink)",
            color: "var(--bg)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "8px 10px",
            textAlign: "left",
            cursor: problem ? "not-allowed" : "pointer",
            opacity: problem ? 0.45 : 1,
          }}
        >
          {spanCount > 1 ? `Save ×${spanCount}` : "Save"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="hv-accent-edge"
          style={{
            border: "1px solid var(--line)",
            background: "transparent",
            color: "var(--muted-1)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "8px 10px",
            cursor: "pointer",
          }}
        >
          {spanCount > 1 ? `Delete ×${spanCount}` : "Delete"}
        </button>
      </div>
    </div>
  );
}
