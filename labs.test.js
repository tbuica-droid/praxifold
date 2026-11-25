import test from "node:test";
import assert from "node:assert/strict";
import {
  accounts,
  activation,
  replay,
  modelData,
  trainModel,
  gradeLab,
} from "./labs.js";

test("the downloaded fixture has exactly the promised account-level cohorts", () => {
  const rows = accounts(),
    unique = new Set(rows.map((r) => r.id));
  assert.equal(rows.length, 200);
  assert.equal(unique.size, 198);
  assert.equal(
    rows.some((r) => r.activated && !r.eligible),
    false,
  );
  assert.deepEqual(activation(rows, "eligible"), {
    numerator: 32,
    denom: 80,
    percent: 40,
  });
  assert.deepEqual(activation(rows, "rows"), {
    numerator: 32,
    denom: 200,
    percent: 16,
  });
  assert.equal(activation(rows, "unique").denom, 198);
  assert.throws(() => activation([], "eligible"));
  assert.deepEqual(rows, accounts());
});
test("the briefing gates change the trace and never grade a damaged source pack", () => {
  const run = (pack, selection = "latest", review = "guard") =>
    replay({ pack, selection, review });
  assert.equal(run("missing", "first", "none").status, "Invalid brief");
  assert.equal(run("missing").status, "Paused for review");
  assert.match(run("complete").brief, /120.*POL-02.*OPS-03/);
  assert.equal(run("complete").status, "Valid brief");
  assert.equal(run("complete", "first").status, "Paused for review");
  assert.equal(run("unreadable").status, "Failed");
  assert.deepEqual(run("complete"), run("complete"));
});
test("training learns from one seed split, with independently computed held-out counts", () => {
  const data = modelData(),
    a = trainModel(true, data),
    b = trainModel(false, data);
  assert.equal(data.train.length, 120);
  assert.equal(data.test.length, 40);
  assert.equal(
    new Set([...data.train, ...data.test].map((r) => r.id)).size,
    160,
  );
  assert.equal(a.rule.feature, "receipt");
  assert.equal(a.correct, 40);
  assert.ok(b.correct < 40);
  const expected = [
    [0, 0],
    [0, 0],
  ];
  for (const row of data.test) {
    const pred =
      row[b.rule.feature] <= b.rule.threshold ? b.rule.left : b.rule.right;
    expected[row.label][pred]++;
  }
  assert.deepEqual(b.matrix, expected);
  assert.equal(b.errors.length, 40 - b.correct);
  const majority = Number(data.train.filter((r) => r.label).length > 60);
  assert.equal(
    b.baselineCorrect,
    data.test.filter((r) => r.label === majority).length,
  );
  assert.throws(() => trainModel(false, { train: [], test: [] }));
});
test("lab grades require observable work and real evidence IDs", () => {
  assert.equal(
    gradeLab("launch", {
      output: { cohort: "eligible" },
      refs: "COHORT-02, INT-07",
    }).score,
    50,
  );
  assert.equal(
    gradeLab("launch", {
      output: { cohort: "eligible" },
      refs: "cohort-02, int-06",
    }).passed,
    true,
  );
  assert.equal(
    gradeLab("agent", {
      validSeen: true,
      pauseSeen: true,
      architecture: "fixed",
      output: { selection: "latest", review: "guard" },
    }).passed,
    true,
  );
  assert.equal(
    gradeLab("model", { leakScore: 100, cleanScore: 40, interpret: "perfect" })
      .passed,
    false,
  );
});
