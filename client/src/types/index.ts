/**
 * Wire types. These mirror the server's `PublicUser` / `PublicTask` exactly -
 * if one side changes, change both.
 */

export const TASK_PRIORITIES = ["high", "normal"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** `HH:MM` 24-hour, or "" when the task has no set time. */
  time: string;
  priority: TaskPriority;
  done: boolean;
}

export interface TaskInput {
  title: string;
  date: string;
  time: string;
  priority: TaskPriority;
  done: boolean;
}

export type TaskPatch = Partial<TaskInput>;

export type ThemeName = "light" | "dark";
