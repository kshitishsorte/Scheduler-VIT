import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Task, TaskInput, TaskPatch } from "@/types";

interface UseTasks {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  createTask: (input: TaskInput) => Promise<Task | null>;
  /** Resolves with the created tasks so the caller can focus the first one. */
  createTasks: (inputs: TaskInput[]) => Promise<Task[]>;
  patchTask: (id: string, patch: TaskPatch) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

/**
 * Server-backed task state for one visible date range.
 *
 * Edits apply optimistically and roll back if the request fails: dragging a
 * chip to another day has to land under the cursor immediately, and waiting on
 * a round trip would make it feel broken.
 */
export function useTasks(range: { from: string; to: string }): UseTasks {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { from, to } = range;

  // Guards against an earlier, slower request overwriting a later one when the
  // user pages through months quickly.
  const requestRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestRef.current;
    setLoading(true);

    api
      .listTasks({ from, to })
      .then(({ tasks: loaded }) => {
        if (requestRef.current === requestId) setTasks(loaded);
      })
      .catch((err: Error) => {
        if (requestRef.current === requestId) setError(err.message);
      })
      .finally(() => {
        if (requestRef.current === requestId) setLoading(false);
      });
  }, [from, to]);

  const clearError = useCallback(() => setError(null), []);

  const createTask = useCallback(async (input: TaskInput) => {
    try {
      const { task } = await api.createTask(input);
      setTasks((current) => [...current, task]);
      return task;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, []);

  const createTasks = useCallback(async (inputs: TaskInput[]) => {
    if (inputs.length === 0) return [];
    try {
      const { tasks: created } = await api.createTasks(inputs);
      setTasks((current) => [...current, ...created]);
      return created;
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, []);

  const patchTask = useCallback(async (id: string, patch: TaskPatch) => {
    let rollback: Task | undefined;

    setTasks((current) =>
      current.map((task) => {
        if (task.id !== id) return task;
        rollback = task;
        return { ...task, ...patch };
      }),
    );

    try {
      const { task } = await api.updateTask(id, patch);
      // Reconcile with the server's version, which may have trimmed the title
      // or normalised a field.
      setTasks((current) => current.map((t) => (t.id === id ? task : t)));
    } catch (err) {
      setError((err as Error).message);
      if (rollback) {
        const previous = rollback;
        setTasks((current) => current.map((t) => (t.id === id ? previous : t)));
      }
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    let rollback: Task | undefined;

    setTasks((current) =>
      current.filter((task) => {
        if (task.id === id) {
          rollback = task;
          return false;
        }
        return true;
      }),
    );

    try {
      await api.deleteTask(id);
    } catch (err) {
      setError((err as Error).message);
      if (rollback) {
        const previous = rollback;
        setTasks((current) => [...current, previous]);
      }
    }
  }, []);

  return {
    tasks,
    loading,
    error,
    clearError,
    createTask,
    createTasks,
    patchTask,
    deleteTask,
  };
}
