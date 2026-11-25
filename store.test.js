import test from "node:test";
import assert from "node:assert/strict";
import { initial, record, restore, metrics } from "./store.js";
const day = 86400000;
test("missed work survives reload and retries reschedule its review", () => {
  const s = initial(),
    r = {
      title: "Evidence check",
      score: 0,
      passed: false,
      artifact: { decision: "check" },
      reason: "Wrong cohort",
    };
  record(s, "d4", r, 10);
  assert.equal(s.reviews.d4.due, 10 + day);
  const copy = restore(JSON.stringify(s));
  record(copy, "d4", { ...r, passed: true, score: 100 }, 20);
  assert.equal(copy.reviews.d4.due, 20 + 7 * day);
  assert.equal(copy.artifacts.length, 2);
  assert.deepEqual(
    copy.events.map((v) => v.type),
    ["first_result"],
  );
  assert.equal(metrics(copy).improved, 1);
  assert.equal(metrics(copy).firstAttemptMisses, 1);
  assert.equal(JSON.stringify(copy.events).includes("Wrong cohort"), false);
});
test("demonstration requires an unseen, unaided successful case", () => {
  const s = initial(),
    r = { title: "Transfer", passed: true, score: 100 };
  assert.equal(record(s, "d1", { ...r, hinted: true }).demonstrated, false);
  assert.equal(record(s, "d1", { ...r, fresh: true }).demonstrated, true);
  assert.equal(record(s, "d1", { ...r, fresh: true }).demonstrated, false);
  assert.equal(record(s, "capstone", { ...r, fresh: true }).demonstrated, true);
  assert.equal(s.artifacts.at(-1).uid, s.attempts.at(-1).uid);
});
test("pilot return and malformed storage have explicit denominators", () => {
  const s = restore("broken");
  s.created = 0;
  s.visits = [0, 7 * day + 1];
  assert.equal(metrics(s, 6 * day).daySevenEligible, 0);
  assert.equal(metrics(s, 8 * day).daySevenEligible, 1);
  assert.equal(metrics(s, 8 * day).daySevenReturn, 1);
});
