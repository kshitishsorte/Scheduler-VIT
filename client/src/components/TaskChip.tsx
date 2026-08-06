import type { Task } from "@/types";

/** Dot colour encodes the task's state: accent for priority, ink, muted done. */
export function dotColor(task: Task): string {
  if (task.done) return "var(--muted-3)";
  return task.priority === "high" ? "var(--accent)" : "var(--ink)";
}

interface TaskChipProps {
  task: Task;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
}

/** A task as it appears inside a day cell. */
export function TaskChip({ task, onPointerDown }: TaskChipProps) {
  return (
    <div
      data-chip="1"
      onPointerDown={onPointerDown}
      className="hv-chip"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        minWidth: 0,
        padding: "4px 6px",
        background: "var(--surface)",
        cursor: "grab",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          flex: "none",
          background: dotColor(task),
        }}
      />
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          lineHeight: 1.25,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flex: 1,
          color: task.done ? "var(--muted-2)" : "var(--ink)",
          textDecoration: task.done ? "line-through" : "none",
        }}
      >
        {task.title}
      </span>
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 500,
          color: "var(--muted-2)",
          flex: "none",
        }}
      >
        {task.time}
      </span>
    </div>
  );
}

/** The outline left behind in a chip's home cell while it is being dragged. */
export function TaskChipGhost() {
  return (
    <div
      style={{
        height: 23,
        border: "1px dashed var(--muted-3)",
        background: "transparent",
      }}
    />
  );
}
