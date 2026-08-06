import { dotColor } from "./TaskChip";
import type { Task } from "@/types";

interface DragGhostProps {
  task: Task;
  x: number;
  y: number;
  width: number;
}

/**
 * The chip that follows the cursor during a drag. Rendered outside the grid at
 * a fixed position and made click-through, so it never becomes the element
 * under the pointer when working out the drop target.
 */
export function DragGhost({ task, x, y, width }: DragGhostProps) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 60,
        pointerEvents: "none",
        width,
        transform: `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) scale(1.04) rotate(-0.6deg)`,
        boxShadow: "0 12px 32px var(--shadow-drag)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 6px",
        background: "var(--raised)",
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
