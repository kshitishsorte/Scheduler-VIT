import { TaskChip, TaskChipGhost } from "./TaskChip";
import { TaskEditor, type EditingDraft } from "./TaskEditor";
import type { Task } from "@/types";

export interface DayCellProps {
  index: number;
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  tasks: Task[];
  /** How many chips fit; -1 when the cell is too short for any. */
  visibleCount: number;
  overflow: boolean;
  /** Cell being dragged over - drop target highlight. */
  isTarget: boolean;
  /** Cell inside the current drag-to-create range. */
  inRange: boolean;
  draggingTaskId: string | null;
  /** The open editor's draft, when it belongs to a task in this cell. */
  editing: EditingDraft | null;
  draft: { title: string; span: number } | null;
  onCellPointerDown: (index: number, event: React.PointerEvent) => void;
  onChipPointerDown: (task: Task, event: React.PointerEvent<HTMLDivElement>) => void;
  onExpand: (dateKey: string) => void;
  onEditorChange: (
    patch: Partial<Omit<EditingDraft, "task" | "siblingIds">>,
  ) => void;
  onEditorDelete: () => void;
  onEditorClose: () => void;
  onEditorCancel: () => void;
  onDraftTitle: (title: string) => void;
  onDraftCommit: () => void;
  onDraftCancel: () => void;
  dateKey: string;
}

const stop = (event: React.SyntheticEvent) => event.stopPropagation();

export function DayCell({
  index,
  date,
  inMonth,
  isToday,
  tasks,
  visibleCount,
  overflow,
  isTarget,
  inRange,
  draggingTaskId,
  editing,
  draft,
  onCellPointerDown,
  onChipPointerDown,
  onExpand,
  onEditorChange,
  onEditorDelete,
  onEditorClose,
  onEditorCancel,
  onDraftTitle,
  onDraftCommit,
  onDraftCancel,
  dateKey,
}: DayCellProps) {
  const shown = overflow
    ? tasks.slice(0, Math.max(0, visibleCount))
    : visibleCount < 0
      ? []
      : tasks;

  const hiddenCount = tasks.length - shown.length;
  const moreLabel =
    shown.length === 0
      ? `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`
      : `+${hiddenCount} more`;

  // A popover or draft input must escape the cell's bounds, so clipping is
  // lifted only while one is open.
  const hasOpenOverlay = Boolean(draft) || Boolean(editing);

  return (
    <div
      data-idx={index}
      onPointerDown={(event) => onCellPointerDown(index, event)}
      style={{
        position: "relative",
        background: "var(--bg)",
        padding: "7px 8px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        cursor: "crosshair",
        minHeight: 0,
        overflow: hasOpenOverlay ? "visible" : "hidden",
      }}
    >
      {inRange && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--tint)",
            pointerEvents: "none",
          }}
        />
      )}
      {isTarget && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: "inset 0 0 0 2px var(--accent)",
            background: "var(--tint-soft)",
            pointerEvents: "none",
          }}
        />
      )}

      <div
        onPointerDown={stop}
        onClick={() => onExpand(dateKey)}
        title="Open this day"
        className="hv-fade"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          height: 22,
          marginBottom: 1,
          cursor: "pointer",
        }}
      >
        {isToday ? (
          <div
            style={{
              width: 22,
              height: 22,
              background: "var(--accent)",
              color: "var(--on-accent)",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {date.getDate()}
          </div>
        ) : (
          <div
            style={{
              fontSize: 12,
              fontWeight: inMonth ? 600 : 400,
              color: inMonth ? "var(--ink)" : "var(--muted-3)",
              paddingLeft: 1,
            }}
          >
            {date.getDate()}
          </div>
        )}
      </div>

      {shown.map((task) => (
        <div key={task.id} style={{ position: "relative", minWidth: 0 }}>
          {draggingTaskId === task.id ? (
            <TaskChipGhost />
          ) : (
            <TaskChip
              task={task}
              onPointerDown={(event) => onChipPointerDown(task, event)}
            />
          )}

          {editing?.task.id === task.id && (
            <TaskEditor
              draft={editing}
              onChange={onEditorChange}
              onDelete={onEditorDelete}
              onClose={onEditorClose}
              onCancel={onEditorCancel}
            />
          )}
        </div>
      ))}

      {draft && (
        <div
          onPointerDown={stop}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 6px",
            background: "var(--field)",
            boxShadow: "inset 0 0 0 1px var(--accent)",
            cursor: "text",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              flex: "none",
              background: "var(--accent)",
            }}
          />
          <input
            value={draft.title}
            onChange={(event) => onDraftTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onDraftCommit();
              if (event.key === "Escape") onDraftCancel();
            }}
            onBlur={onDraftCommit}
            autoFocus
            placeholder="Name this task…"
            aria-label="New task title"
            maxLength={200}
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              background: "transparent",
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--ink)",
              padding: 0,
              outline: "none",
            }}
          />
          {draft.span > 1 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--accent)",
                flex: "none",
              }}
            >
              ×{draft.span}
            </span>
          )}
        </div>
      )}

      {overflow && (
        <button
          type="button"
          onPointerDown={stop}
          onClick={() => onExpand(dateKey)}
          className="hv-accent-text"
          style={{
            border: "none",
            background: "transparent",
            textAlign: "left",
            padding: "2px 6px",
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "var(--muted-1)",
            cursor: "pointer",
          }}
        >
          {moreLabel}
        </button>
      )}
    </div>
  );
}
