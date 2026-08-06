import {
  draftFor,
  draftPatch,
  draftTargets,
  draftError,
} from "../src/components/TaskEditor.tsx";
import type { Task } from "../src/types/index.ts";

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) console.log(`  ok   ${name}`);
  else {
    failures++;
    console.log(`  FAIL ${name}\n       expected ${e}\n       actual   ${a}`);
  }
}

const task = (id: string, date: string): Task => ({
  id,
  title: "Exam prep",
  date,
  time: "",
  priority: "normal",
  done: false,
});

console.log("\nA 3-day drag: the time lands on every day, not just the first");
{
  // What commitDraft builds: first task shown, the rest ride along.
  const created = [
    task("t1", "2026-08-10"),
    task("t2", "2026-08-11"),
    task("t3", "2026-08-12"),
  ];
  const draft = draftFor(created[0]!, ["t2", "t3"]);

  check("targets cover all 3 days", draftTargets(draft), ["t1", "t2", "t3"]);

  // The user types a time into the editor that opened on day one.
  const edited = { ...draft, time: "930" };
  check("patch carries the time", draftPatch(edited), { time: "09:30" });
  check("applies to all 3", draftTargets(edited).length, 3);
}

console.log("\nA single task edit still touches only itself");
{
  const draft = draftFor(task("solo", "2026-08-10"));
  check("one target", draftTargets(draft), ["solo"]);
  check("patch", draftPatch({ ...draft, time: "8" }), { time: "08:00" });
}

console.log("\nInvalid input is never written back");
{
  const draft = draftFor(task("t1", "2026-08-10"));
  check("bad hours blocked", draftError({ ...draft, time: "25:00" })?.includes("Hours"), true);
  check("bad minutes blocked", draftError({ ...draft, time: "10:75" })?.includes("Minutes"), true);
  check("empty title blocked", draftError({ ...draft, title: "  " }), "Give the task a name");
  check("valid passes", draftError({ ...draft, time: "930" }), null);
  // A dismissal with a bad time keeps the rest of the edit and drops the time.
  check(
    "bad time omitted from patch",
    draftPatch({ ...draft, title: "Renamed", time: "25:00" }),
    { title: "Renamed" },
  );
}

console.log("\nPriority and done are independent");
{
  const high = { ...task("t1", "2026-08-10"), priority: "high" as const };
  const draft = draftFor(high);
  check("mode starts high", draft.mode, "high");
  check("marking done keeps priority", draftPatch({ ...draft, mode: "done" }), { done: true });

  const doneHigh = { ...high, done: true };
  const undo = draftFor(doneHigh);
  check("done task opens as done", undo.mode, "done");
  check("undo restores high", draftPatch({ ...undo, mode: "high" }), { done: false });
}

console.log("\nNo-op close sends nothing");
check("unchanged draft", draftPatch(draftFor(task("t1", "2026-08-10"))), {});

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} FAILED\n`);
process.exit(failures === 0 ? 0 : 1);

