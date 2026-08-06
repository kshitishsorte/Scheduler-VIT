import type { Task, TaskInput, TaskPatch, User } from "@/types";

/** An error carrying the HTTP status and any field-level detail the API sent. */
export class ApiError extends Error {
  readonly status: number;
  readonly details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface ErrorBody {
  error?: string;
  details?: Array<{ path?: string; message?: string }>;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      // Without this the session cookie is neither sent nor stored.
      credentials: "include",
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
      ...init,
    });
  } catch {
    // fetch only rejects on a transport failure, so this is genuinely "the
    // server is unreachable" rather than any HTTP error status.
    throw new ApiError(0, "Cannot reach the server. Is it running?");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const err = (body ?? {}) as ErrorBody;
    const details = (err.details ?? [])
      .map((d) => d.message)
      .filter((m): m is string => Boolean(m));
    throw new ApiError(
      response.status,
      details[0] ?? err.error ?? `Request failed (${response.status})`,
      details,
    );
  }

  return body as T;
}

export const api = {
  signup(input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    return request<{ user: User }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  login(input: { email: string; password: string }) {
    return request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  logout() {
    return request<void>("/auth/logout", { method: "POST" });
  },

  me() {
    return request<{ user: User }>("/auth/me");
  },

  listTasks(range: { from: string; to: string }) {
    const query = new URLSearchParams(range).toString();
    return request<{ tasks: Task[] }>(`/tasks?${query}`);
  },

  createTask(input: TaskInput) {
    return request<{ task: Task }>("/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  createTasks(tasks: TaskInput[]) {
    return request<{ tasks: Task[] }>("/tasks/bulk", {
      method: "POST",
      body: JSON.stringify({ tasks }),
    });
  },

  updateTask(id: string, patch: TaskPatch) {
    return request<{ task: Task }>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  deleteTask(id: string) {
    return request<void>(`/tasks/${id}`, { method: "DELETE" });
  },
};
