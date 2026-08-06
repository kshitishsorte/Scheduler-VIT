import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A scheduled task, matching the shape the Scheduler design works in: it lives
 * on a day, optionally at a time, and carries a priority plus a done flag.
 */

export const TASK_PRIORITIES = ["high", "normal"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** `YYYY-MM-DD`. */
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** `HH:MM`, 24-hour. Empty string means the task has no time. */
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const taskSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },
    /**
     * Stored as a plain `YYYY-MM-DD` string rather than a Date.
     *
     * A task pinned to a calendar square has no instant attached to it - a task
     * on the 10th is on the 10th everywhere. Storing a Date would anchor it to
     * an instant, and a user in a different timezone (or a server running UTC)
     * would see it slide to the 9th or the 11th. Strings in this format sort
     * and range-compare chronologically, so nothing is lost.
     */
    date: {
      type: String,
      required: true,
      match: [DATE_PATTERN, "Date must be formatted YYYY-MM-DD"],
    },
    /** `HH:MM` in 24-hour form, or "" for a task with no set time. */
    time: {
      type: String,
      default: "",
      validate: {
        validator: (value: string) => value === "" || TIME_PATTERN.test(value),
        message: "Time must be formatted HH:MM",
      },
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: "normal",
    },
    /**
     * Kept separate from `priority` rather than folded in as a third priority
     * value, so completing a task and then undoing it restores whether it was
     * a priority instead of silently demoting it to normal.
     */
    done: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Every list request is "this user's tasks between two dates".
taskSchema.index({ userId: 1, date: 1 });

export type TaskDocument = InferSchemaType<typeof taskSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export interface PublicTask {
  id: string;
  title: string;
  date: string;
  time: string;
  priority: TaskPriority;
  done: boolean;
}

export function toPublicTask(task: TaskDocument): PublicTask {
  return {
    id: task._id.toString(),
    title: task.title,
    date: task.date,
    time: task.time ?? "",
    priority: (task.priority ?? "normal") as TaskPriority,
    done: task.done ?? false,
  };
}

export const Task: Model<TaskDocument> =
  (mongoose.models.Task as Model<TaskDocument>) ??
  mongoose.model<TaskDocument>("Task", taskSchema);
