import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarHeader } from "@/components/CalendarHeader";
import { DayCell } from "@/components/DayCell";
import { DayModal } from "@/components/DayModal";
import { DragGhost } from "@/components/DragGhost";
import {
  draftFor,
  draftPatch,
  draftTargets,
  type EditingDraft,
} from "@/components/TaskEditor";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/lib/useTheme";
import { useTasks } from "@/tasks/useTasks";
import {
  currentMonth,
  dateKey,
  gridRange,
  groupByDate,
  monthCells,
  nextMonth,
  pluralTasks,
  prevMonth,
  todayKey,
  weekdayLabels,
} from "@/lib/calendar";
import type { MonthCursor } from "@/lib/calendar";
import type { Task, TaskInput } from "@/types";

/** Pointer travel, in px, before a press on a chip becomes a drag not a click. */
const DRAG_THRESHOLD = 4;

interface PendingPress {
  taskId: string;
  x0: number;
  y0: number;
  /** Cursor offset inside the chip, so the ghost keeps its grab point. */
  ox: number;
  oy: number;
  width: number;
}

interface DragState extends PendingPress {
  x: number;
  y: number;
  over: number | null;
}

interface CreateRange {
  a: number;
  b: number;
}

interface Draft {
  index: number;
  span: number;
  title: string;
}

/** Finds the grid cell under the pointer, or null if the pointer left the grid. */
function cellIndexAt(event: PointerEvent): number | null {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const cell = element?.closest?.("[data-idx]");
  if (!cell) return null;
  const index = Number(cell.getAttribute("data-idx"));
  return Number.isNaN(index) ? null : index;
}

export function SchedulerPage() {
  const { logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();

  const [cursor, setCursor] = useState<MonthCursor>(currentMonth);
  const [pending, setPending] = useState<PendingPress | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [create, setCreate] = useState<CreateRange | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<EditingDraft | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cellHeight, setCellHeight] = useState(120);

  const cells = useMemo(() => monthCells(cursor), [cursor]);
  const range = useMemo(() => gridRange(cells), [cells]);

  const {
    tasks,
    error,
    clearError,
    createTask,
    createTasks,
    patchTask,
    deleteTask,
  } = useTasks(range);

  const byDate = useMemo(() => groupByDate(tasks), [tasks]);
  const today = todayKey();

  const gridRef = useRef<HTMLDivElement | null>(null);

  // Window listeners are registered once; reading live values from a ref keeps
  // them from capturing stale state on every render.
  const live = useRef({ pending, drag, create, cells, editing, expanded, tasks });
  live.current = { pending, drag, create, cells, editing, expanded, tasks };

  /* ── how many chips fit in a cell ──────────────────────────────────────
     Measured rather than assumed, so the grid stays honest at any window
     size. `capAll` is what fits with no "+N more" row; `cap` is what fits
     once that row takes its place. */
  const body = Math.max(0, cellHeight - 15 - 23) + 3;
  const capAll = Math.floor(body / 26);
  const cap = body >= 24 ? Math.max(0, Math.floor((body - 21) / 26)) : -1;

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const readCell = () => {
      const first = grid.firstElementChild;
      if (!first) return;
      const height = Math.round(first.getBoundingClientRect().height);
      if (height > 0) {
        setCellHeight((current) => (current === height ? current : height));
      }
    };

    readCell();
    const observer = new ResizeObserver(readCell);
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  /**
   * Writes the open editor's changes back and closes it. Every path that
   * dismisses the editor goes through here, so an edit is never lost to a
   * dismissal the editor itself could not observe.
   */
  const closeEditor = useCallback(() => {
    const open = live.current.editing;
    if (open) {
      const patch = draftPatch(open);
      if (Object.keys(patch).length > 0) {
        // Applies to every day of a dragged span, not just the day the popover
        // sat on - `draftTargets` is the one task plus any span siblings.
        for (const id of draftTargets(open)) {
          void patchTask(id, patch);
        }
      }
    }
    setEditing(null);
  }, [patchTask]);

  /** Escape: abandon the edit rather than writing it back. */
  const cancelEditor = useCallback(() => setEditing(null), []);

  const closeEditorRef = useRef(closeEditor);
  closeEditorRef.current = closeEditor;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (live.current.expanded) setExpanded(null);
      else if (live.current.editing) setEditing(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const commitDraft = useCallback(async () => {
    const current = draft;
    if (!current) return;

    setDraft(null);
    const title = current.title.trim();
    if (!title) return;

    // One task per day in the dragged span.
    const inputs: TaskInput[] = [];
    for (let i = 0; i < current.span; i++) {
      const cell = cells[current.index + i];
      if (!cell) break;
      inputs.push({
        title,
        date: dateKey(cell),
        time: "",
        priority: "normal",
        done: false,
      });
    }

    const created = await createTasks(inputs);
    // Open the new task straight away so a time or priority can be set. The
    // rest of the span rides along, so whatever is set here lands on all of it.
    if (created[0]) {
      setEditing(
        draftFor(
          created[0],
          created.slice(1).map((task) => task.id),
        ),
      );
    }
  }, [draft, cells, createTasks]);

  const commitDraftRef = useRef(commitDraft);
  commitDraftRef.current = commitDraft;

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const state = live.current;

      if (state.pending) {
        const movedFar =
          Math.abs(event.clientX - state.pending.x0) > DRAG_THRESHOLD ||
          Math.abs(event.clientY - state.pending.y0) > DRAG_THRESHOLD;

        if (movedFar) {
          setDrag({
            ...state.pending,
            x: event.clientX - state.pending.ox,
            y: event.clientY - state.pending.oy,
            over: cellIndexAt(event),
          });
          setPending(null);
          closeEditorRef.current();
        }
        return;
      }

      if (state.drag) {
        const dragging = state.drag;
        setDrag({
          ...dragging,
          x: event.clientX - dragging.ox,
          y: event.clientY - dragging.oy,
          over: cellIndexAt(event),
        });
        return;
      }

      if (state.create) {
        const index = cellIndexAt(event);
        if (index !== null && index !== state.create.b) {
          setCreate({ a: state.create.a, b: index });
        }
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const state = live.current;

      if (state.drag) {
        const index = cellIndexAt(event);
        const target = index === null ? null : state.cells[index];
        if (target) {
          const key = dateKey(target);
          // Dropping a chip back where it started should not fire a request.
          const moved = state.tasks.find((t) => t.id === state.drag!.taskId);
          if (moved && moved.date !== key) {
            void patchTask(state.drag.taskId, { date: key });
          }
        }
        setDrag(null);
        return;
      }

      // A press that never travelled is a click: open that chip's editor.
      if (state.pending) {
        const task = state.tasks.find((t) => t.id === state.pending!.taskId);
        setPending(null);
        setExpanded(null);
        if (task) setEditing(draftFor(task));
        return;
      }

      if (state.create) {
        const from = Math.min(state.create.a, state.create.b);
        const to = Math.max(state.create.a, state.create.b);
        setCreate(null);
        setDraft({ index: from, span: to - from + 1, title: "" });
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [patchTask]);

  const onCellPointerDown = useCallback(
    (index: number) => {
      // A press anywhere on the grid first dismisses whatever is open.
      if (live.current.editing || live.current.expanded) {
        closeEditorRef.current();
        setExpanded(null);
        return;
      }
      setDraft(null);
      setCreate({ a: index, b: index });
    },
    [],
  );

  const onChipPointerDown = useCallback(
    (task: Task, event: React.PointerEvent<HTMLDivElement>) => {
      if (live.current.editing?.task.id === task.id) return;

      const rect = event.currentTarget.getBoundingClientRect();
      event.stopPropagation();
      setPending({
        taskId: task.id,
        x0: event.clientX,
        y0: event.clientY,
        ox: event.clientX - rect.left,
        oy: event.clientY - rect.top,
        width: rect.width,
      });
    },
    [],
  );

  /** Month navigation flushes any open editor before the grid changes under it. */
  const goToMonth = useCallback(
    (next: MonthCursor) => {
      closeEditorRef.current();
      setExpanded(null);
      setDraft(null);
      setCursor(next);
    },
    [],
  );

  const draggingTask = drag
    ? (tasks.find((task) => task.id === drag.taskId) ?? null)
    : null;

  const createFrom = create ? Math.min(create.a, create.b) : -1;
  const createTo = create ? Math.max(create.a, create.b) : -2;

  const monthPrefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  const monthCount = tasks.filter((task) =>
    task.date.startsWith(monthPrefix),
  ).length;

  const expandedDate = expanded
    ? (cells.find((cell) => dateKey(cell) === expanded) ?? null)
    : null;

  return (
    <div
      style={{
        fontFamily: "'Archivo', system-ui, sans-serif",
        color: "var(--ink)",
        background: "var(--bg)",
        height: "100vh",
        transition:
          "background 220ms cubic-bezier(.2,.8,.2,1), color 220ms cubic-bezier(.2,.8,.2,1)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <CalendarHeader
        cursor={cursor}
        countLabel={
          monthCount === 0 ? "Nothing scheduled" : pluralTasks(monthCount)
        }
        theme={theme}
        onToggleTheme={toggleTheme}
        onPrev={() => goToMonth(prevMonth(cursor))}
        onNext={() => goToMonth(nextMonth(cursor))}
        onToday={() => goToMonth(currentMonth())}
        onSignOut={() => void logout()}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: 1,
          padding: "0 32px",
        }}
      >
        {weekdayLabels().map((label) => (
          <div
            key={label}
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--muted-1)",
              padding: "0 8px 8px",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div
        style={{ flex: 1, minHeight: 0, padding: "0 32px 0", display: "flex" }}
      >
        {/* The 1px gap over a --line background is what draws the grid rules. */}
        <div
          ref={gridRef}
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gridAutoRows: "minmax(0, 1fr)",
            gap: 1,
            background: "var(--line)",
            borderTop: "2px solid var(--ink)",
            borderBottom: "2px solid var(--ink)",
          }}
        >
          {cells.map((date, index) => {
            const key = dateKey(date);
            const dayTasks = byDate.get(key) ?? [];
            const cellEditing =
              editing && editing.task.date === key ? editing : null;

            return (
              <DayCell
                key={key}
                index={index}
                date={date}
                dateKey={key}
                inMonth={date.getMonth() === cursor.month}
                isToday={key === today}
                tasks={dayTasks}
                visibleCount={cap}
                overflow={dayTasks.length > capAll && cap >= 0}
                isTarget={drag?.over === index}
                inRange={index >= createFrom && index <= createTo}
                draggingTaskId={drag?.taskId ?? null}
                editing={cellEditing}
                draft={
                  draft?.index === index
                    ? { title: draft.title, span: draft.span }
                    : null
                }
                onCellPointerDown={onCellPointerDown}
                onChipPointerDown={onChipPointerDown}
                onExpand={setExpanded}
                onEditorChange={(patch) =>
                  setEditing((current) =>
                    current ? { ...current, ...patch } : current,
                  )
                }
                onEditorDelete={() => {
                  const targets = editing ? draftTargets(editing) : [];
                  setEditing(null);
                  // Removes the whole span - the editor labels itself "Delete ×N"
                  // when it stands for more than one day.
                  for (const id of targets) void deleteTask(id);
                }}
                onEditorClose={closeEditor}
                onEditorCancel={cancelEditor}
                onDraftTitle={(title) =>
                  setDraft((current) => (current ? { ...current, title } : null))
                }
                onDraftCommit={() => void commitDraftRef.current()}
                onDraftCancel={() => setDraft(null)}
              />
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          padding: "12px 32px 16px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.04em",
            color: "var(--muted-2)",
          }}
        >
          Drag across days to add to each · Drag a task to move it · Click a date
          to open the day · Times are 24h
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            ["var(--accent)", "Priority"],
            ["var(--ink)", "Normal"],
            ["var(--muted-3)", "Done"],
          ].map(([color, label]) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span style={{ width: 5, height: 5, background: color }} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--muted-1)",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {expandedDate && expanded && (
        <DayModal
          date={expandedDate}
          dateKey={expanded}
          tasks={byDate.get(expanded) ?? []}
          onClose={() => setExpanded(null)}
          onToggleDone={(task) => void patchTask(task.id, { done: !task.done })}
          onAdd={(input) => void createTask(input)}
        />
      )}

      {draggingTask && drag && (
        <DragGhost task={draggingTask} x={drag.x} y={drag.y} width={drag.width} />
      )}

      {/* Not in the design, but silently dropping a failed save would be worse
          than a line of text saying so. */}
      {error && (
        <div
          role="alert"
          style={{
            position: "fixed",
            left: 32,
            bottom: 32,
            zIndex: 80,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--raised)",
            border: "2px solid var(--accent)",
            padding: "10px 12px",
            boxShadow: "0 12px 32px var(--shadow-lg-color)",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>
            {error}
          </span>
          <button
            type="button"
            onClick={clearError}
            className="hv-accent-text"
            style={{
              border: "none",
              background: "transparent",
              color: "var(--muted-1)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
