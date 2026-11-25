import test from "node:test";
import assert from "node:assert/strict";
import { lessons, gradeDrill, gradeCapstone } from "./lessons.js";
test("twelve drills each have two distinct sourced cases and a stable id", () => {
  assert.deepEqual(
    lessons.map((l) => l.id),
    [...Array.from({ length: 12 }, (_, i) => "d" + (i + 1)), "capstone"],
  );
  for (const l of lessons.slice(0, -1)) {
    assert.equal(l.cases.length, 2);
    assert.notEqual(l.cases[0].context, l.cases[1].context);
    for (const c of l.cases) {
      assert.ok(c.sources.every((s) => s.id && s.body));
      assert.ok(c.worked && c.hint);
      if (c.options) {
        assert.ok(c.options[c.correct]);
        assert.ok(c.options.every((o) => o.reason));
      }
      assert.ok(
        gradeDrill(c, {
          choice: c.correct,
          amount: c.number?.value,
          ...c.mapping,
        }).passed,
      );
      assert.equal(gradeDrill(c, { choice: -1, amount: "" }).passed, false);
    }
  }
});
test("eligible cohort grading excludes blank input, event rows, and numeric junk", () => {
  const c = lessons.find((l) => l.id === "d4").cases[0];
  for (const answer of ["", " ", "16", "40%", "Infinity", "32"])
    assert.equal(gradeDrill(c, { amount: answer }).passed, false);
  assert.equal(gradeDrill(c, { amount: "40.0" }).score, 100);
});
test("capstone grades source references independently of prose and self-review", () => {
  const input = {
    choice: 1,
    amount: 58,
    refs: "EVT-12, REG-08",
    writing: "Review manually",
    self: [],
  };
  assert.equal(gradeCapstone(input).score, 100);
  for (const refs of ["EVT-123,REG-08", "REG-08", "EVT-12/REG-08/FAKE"])
    assert.equal(gradeCapstone({ ...input, refs }).score, 67);
  assert.equal(gradeCapstone({ ...input, amount: 70, choice: 0 }).score, 33);
});
