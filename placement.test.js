import test from "node:test";
import assert from "node:assert/strict";
import { items } from "./placement-items.js";
import {
  newQuiz,
  validAnswer,
  completeQuiz,
  planFor,
  UNSURE,
} from "./placement.js";
import { lessons } from "./lessons.js";
import { restore, initial } from "./store.js";
const ready = (goal = "", change = {}) => ({
  ...newQuiz(goal),
  answers: {
    ...Object.fromEntries(items.map((q) => [q.id, q.answer])),
    ...change,
  },
});
test("placement samples all paths and links each question to a playable drill", () => {
  assert.equal(new Set(items.map((q) => q.id)).size, 9);
  for (const path of ["use", "build", "understand"])
    assert.equal(items.filter((q) => q.path === path).length, 3);
  for (const q of items) {
    assert.ok(validAnswer(q, q.answer));
    assert.ok(lessons.some((l) => l.id === q.lesson && l.path === q.path));
  }
});
test("a complete check requires real answers or an explicit unsure", () => {
  const q = items.find((q) => !q.options);
  for (const bad of ["", "  ", "0x19", "banana", Infinity])
    assert.equal(validAnswer(q, bad), false);
  assert.equal(validAnswer(q, "25.0"), true);
  assert.equal(completeQuiz(newQuiz()), null);
  assert.equal(
    completeQuiz(ready("", { [q.id]: UNSURE })).answers[q.id],
    UNSURE,
  );
});
test("goals break ties, gaps determine drills, and practice updates the plan", () => {
  assert.equal(planFor(completeQuiz(ready("build")))[0].id, "agent");
  const profile = completeQuiz(
    ready("build", { "use-rate": "10", "model-timing": UNSURE }),
  );
  const steps = planFor(profile);
  assert.equal(steps[0].id, "d4");
  assert.ok(steps.find((s) => s.id === "d11").reason.includes("unsure"));
  assert.equal(planFor(profile, [{ id: "d4", passed: true }])[0].id, "d11");
  const all = planFor(
    completeQuiz(
      ready("", Object.fromEntries(items.map((q) => [q.id, UNSURE]))),
    ),
  );
  assert.equal(new Set(all.map((s) => s.id)).size, all.length);
  assert.equal(
    planFor(
      profile,
      steps.map((s) => ({ id: s.id, passed: true })),
    ).length,
    0,
  );
});
test("prior guest progress and an unfinished retake survive a reload", () => {
  const s = initial();
  s.last = "d2";
  const existing = restore(JSON.stringify(s));
  assert.deepEqual(planFor(existing.placement), []);
  existing.placement = {
    draft: newQuiz("use"),
    profile: completeQuiz(ready("build")),
  };
  const back = restore(JSON.stringify(existing));
  assert.equal(back.last, "d2");
  assert.equal(back.placement.draft.goal, "use");
  assert.equal(planFor(back.placement.profile)[0].id, "agent");
});
