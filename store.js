const KEY = "praxifold.guest.v1";
export const initial = () => ({
  version: 1,
  created: Date.now(),
  drafts: {},
  attempts: [],
  reviews: {},
  artifacts: [],
  events: [],
  visits: [],
  last: null,
});
export function restore(raw) {
  try {
    const d = JSON.parse(raw);
    if (
      d?.version === 1 &&
      Array.isArray(d.attempts) &&
      Array.isArray(d.events) &&
      Array.isArray(d.artifacts) &&
      Array.isArray(d.visits) &&
      d.drafts &&
      d.reviews
    )
      return d;
  } catch {}
  return initial();
}
export function record(state, id, result, now = Date.now()) {
  const uid = crypto.randomUUID(),
    prior = state.attempts.filter((a) => a.id === id),
    wasReview = !!state.reviews[id];
  const a = {
    uid,
    id,
    at: now,
    score: result.score,
    passed: !!result.passed,
    hinted: !!result.hinted,
    fresh: !!result.fresh,
    demonstrated: !!(
      result.passed &&
      result.fresh &&
      !result.hinted &&
      !prior.some((p) => p.fresh && p.artifactKey === result.artifactKey)
    ),
    artifactKey: result.artifactKey,
    title: result.title,
    rubric: result.rubric,
  };
  state.attempts.push(a);
  if (!a.passed || wasReview)
    state.reviews[id] = {
      due: now + (a.passed ? 7 : 1) * 86400000,
      reason: a.passed
        ? "Confirm retention on a later attempt."
        : result.reason || "Revisit the evidence behind your last answer.",
      last: uid,
    };
  state.artifacts.push({
    uid,
    id,
    at: now,
    title: result.title,
    work: result.artifact ?? {},
    rubric: result.rubric,
    score: a.score,
  });
  if (!state.events.some((e) => e.type === "first_result"))
    event(state, "first_result", id, now);
  if (a.fresh && id === "capstone")
    event(state, "fresh_case_completion", id, now);
  return a;
}
export function event(state, type, id = "", at = Date.now()) {
  state.events.push({ type, id, at });
}
export function metrics(s, now = Date.now()) {
  const missed = [...new Set(s.attempts.map((a) => a.id))].filter(
    (id) => !s.attempts.find((a) => a.id === id).passed,
  );
  return {
    improved: missed.filter((id) =>
      s.attempts.some((a) => a.id === id && a.passed),
    ).length,
    firstAttemptMisses: missed.length,
    daySevenEligible: Number(now - s.created >= 7 * 86400000),
    daySevenReturn: Number(
      s.visits.some(
        (v) => v - s.created >= 7 * 86400000 && v - s.created < 8 * 86400000,
      ),
    ),
    interestSubmissions: s.events.filter((e) => e.type === "interest_submitted")
      .length,
    guestsViewingPlans: Number(s.events.some((e) => e.type === "plan_view")),
    planViews: s.events.filter((e) => e.type === "plan_view").length,
  };
}
export const storageKey = KEY;
