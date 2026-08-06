import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../lib/ApiError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth, requireUser } from "../middleware/requireAuth.js";
import {
  DATE_PATTERN,
  TASK_PRIORITIES,
  TIME_PATTERN,
  Task,
  toPublicTask,
} from "../models/Task.js";

const router = Router();

// Every route below is owner-scoped; none are reachable anonymously.
router.use(requireAuth);

/** Checks the calendar, not just the shape: 2026-02-30 matches the regex. */
function isRealDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  if (month < 1 || month > 12 || day < 1) return false;
  // Day 0 of the next month is the last day of this one.
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

const dateString = z
  .string()
  .regex(DATE_PATTERN, "Date must be formatted YYYY-MM-DD")
  .refine(isRealDate, "That date does not exist");

/** Either "HH:MM" or "" - the design treats a missing time as valid. */
const timeString = z
  .string()
  .refine((value) => value === "" || TIME_PATTERN.test(value), {
    message: "Time must be formatted HH:MM",
  });

const listQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
});

const createSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  date: dateString,
  time: timeString.default(""),
  priority: z.enum(TASK_PRIORITIES).default("normal"),
  done: z.boolean().default(false),
});

const updateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    date: dateString.optional(),
    time: timeString.optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    done: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid task id");

/**
 * Lists the caller's tasks, optionally limited to a date window. Because dates
 * are `YYYY-MM-DD`, a lexicographic range is also a chronological one.
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const { from, to } = listQuerySchema.parse(req.query);

    const filter: Record<string, unknown> = { userId: user._id };
    if (from || to) {
      filter.date = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }

    const tasks = await Task.find(filter).sort({ date: 1, time: 1 });
    res.json({ tasks: tasks.map(toPublicTask) });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const input = createSchema.parse(req.body);

    const task = await Task.create({ ...input, userId: user._id });
    res.status(201).json({ task: toPublicTask(task) });
  }),
);

/**
 * Bulk create, used by drag-across-days: one task per day in the dragged range.
 * A single request keeps the whole span atomic from the client's point of view
 * and avoids firing up to 42 parallel POSTs.
 */
router.post(
  "/bulk",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const { tasks: input } = z
      .object({ tasks: z.array(createSchema).min(1).max(42) })
      .parse(req.body);

    const created = await Task.insertMany(
      input.map((task) => ({ ...task, userId: user._id })),
    );

    res.status(201).json({ tasks: created.map(toPublicTask) });
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const id = objectId.parse(req.params.id);
    const input = updateSchema.parse(req.body);

    // Matching on userId as well as id is what stops one user editing
    // another's task by guessing its id.
    const task = await Task.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set: input },
      { new: true, runValidators: true },
    );

    if (!task) {
      throw ApiError.notFound("Task not found");
    }

    res.json({ task: toPublicTask(task) });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const id = objectId.parse(req.params.id);

    const deleted = await Task.findOneAndDelete({ _id: id, userId: user._id });
    if (!deleted) {
      throw ApiError.notFound("Task not found");
    }

    res.status(204).end();
  }),
);

export default router;
