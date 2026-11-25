import { paths, icon } from "./art.js";
import { items } from "./placement-items.js";

export const UNSURE = "unsure";
export const newQuiz = (goal = "") => ({
  version: 1,
  goal,
  index: 0,
  answers: {},
});

export function validAnswer(item, value) {
  if (value === UNSURE) return true;
  if (typeof value !== "string" || !value.trim()) return false;
  if (item.options)
    return item.options.some((_, index) => String(index) === value);
  return (
    /^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()) &&
    Number.isFinite(Number(value))
  );
}

export function outcome(item, value) {
  if (!validAnswer(item, value) || value === UNSURE) return "unsure";
  const correct = item.options
    ? value === item.answer
    : Number(value) === Number(item.answer);
  return correct ? "correct" : "missed";
}

export function completeQuiz(draft) {
  if (!items.every((item) => validAnswer(item, draft.answers[item.id])))
    return null;
  return {
    version: 1,
    goal: draft.goal,
    answers: { ...draft.answers },
    completedAt: Date.now(),
  };
}

// Build the plan from current practice evidence so a passed activity falls off the queue.
export function planFor(profile, attempts = []) {
  if (!profile || profile.version !== 1 || !profile.answers) return [];
  const passed = new Set(attempts.filter((a) => a.passed).map((a) => a.id));
  const groups = paths
    .map((path) => {
      const questions = items.filter((item) => item.path === path.id);
      const gaps = questions.filter(
        (item) => outcome(item, profile.answers[item.id]) !== "correct",
      );
      return { path, questions, gaps, count: questions.length - gaps.length };
    })
    .sort(
      (a, b) =>
        a.count - b.count ||
        Number(b.path.id === profile.goal) - Number(a.path.id === profile.goal),
    );
  const steps = [];
  for (const { gaps, path } of groups) {
    for (const item of gaps) {
      if (!steps.some((s) => s.id === item.lesson))
        steps.push({
          id: item.lesson,
          path: path.id,
          reason:
            outcome(item, profile.answers[item.id]) === "unsure"
              ? "You marked a question about " +
                item.skill.toLowerCase() +
                " as unsure. Try it with a worked example."
              : "Your answer to the question about " +
                item.skill.toLowerCase() +
                " points to a useful next drill.",
        });
    }
  }
  for (const { path, gaps } of groups)
    steps.push({
      id: path.lab,
      path: path.id,
      reason: gaps.length
        ? "Put the skills from this path together in a hands-on lab."
        : "You answered all three questions on this path correctly. Try applying those ideas to a full brief.",
    });
  steps.push({
    id: "capstone",
    path: "",
    reason: "Bring all three paths together in a fresh case.",
  });
  return steps.filter((s) => !passed.has(s.id));
}

export function renderPlacement(
  root,
  state,
  { save, esc, nameFor, routeFor },
  showPrevious,
) {
  const get = () => state.placement || {};
  const set = (patch) => {
    state.placement = { ...get(), ...patch };
    save();
  };
  const control = (text, cls, attrs = "") =>
    '<button type="button" class="btn ' +
    cls +
    '" ' +
    attrs +
    ">" +
    text +
    "</button>";
  const link = (text, url, cls = "secondary") =>
    `<a class="btn ${cls}" href="#${url}">${esc(text)}</a>`;
  function draw(focus = false) {
    const { draft, profile } = get();
    root.innerHTML =
      '<div class="quiz-wrap"><a class="quiz-back" href="#/practice">Practice studio</a><section class="quiz-surface"></section></div>';
    const area = root.querySelector(".quiz-surface");
    if (profile && (showPrevious || !draft)) results(area, profile);
    else if (draft) question(area, draft);
    else intro(area);
    if (focus) {
      const heading = area.querySelector("h1");
      heading.tabIndex = -1;
      heading.focus();
      heading.scrollIntoView({ block: "nearest" });
    }
  }
  function intro(area) {
    area.innerHTML =
      '<span class="kicker">AI PLACEMENT QUIZ</span><h1>Find your starting point.</h1><p class="quiz-lede">Maybe you already use AI every day. Maybe you’re still figuring out when to trust it. Try nine short questions and we’ll suggest what to practice first.</p><div class="quiz-guide">' +
      paths
        .map((p) => "<span>" + icon(p.icon) + " " + p.title + "</span>")
        .join("") +
      '</div><form><label class="quiz-label" for="goal">What would you most like to work on?</label><select id="goal"><option value="">Help me choose</option>' +
      paths
        .map((p) => '<option value="' + p.id + '">' + p.title + "</option>")
        .join("") +
      '</select><p>We’ll use your preference when two paths are equally good starting points.</p><button class="btn primary">Start the quiz</button></form><p class="quiz-foot">No timer. You can pause and come back in this browser.</p>';
    area.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      set({ draft: newQuiz(area.querySelector("select").value) });
      draw(true);
    };
  }
  function question(area, draft) {
    const i = draft.index,
      item = items[i],
      answer = draft.answers[item.id],
      path = paths.find((p) => p.id === item.path);
    const option = (value, label) =>
      '<label class="ld-option quiz-option"><input type="radio" name="pick" value="' +
      value +
      '" ' +
      (answer === value ? "checked" : "") +
      "><span>" +
      esc(label) +
      "</span></label>";
    area.innerHTML =
      '<div class="quiz-meta"><span class="kicker">' +
      esc(path.title) +
      "</span><strong>Question " +
      (i + 1) +
      " of " +
      items.length +
      '</strong></div><div class="quiz-progress" aria-hidden="true">' +
      items
        .map((_, j) => '<i class="' + (j <= i ? "filled" : "") + '"></i>')
        .join("") +
      "</div><h1>" +
      esc(item.prompt) +
      '</h1><p class="quiz-evidence">' +
      esc(item.context) +
      "</p><form novalidate><fieldset><legend>" +
      (item.options ? "Choose one answer" : "Enter your answer") +
      "</legend>" +
      (item.options
        ? item.options.map((text, n) => option(String(n), text)).join("")
        : '<label class="quiz-label" for="numeric">Your answer (' +
          esc(item.unit) +
          ')</label><input id="numeric" inputmode="decimal" autocomplete="off" value="' +
          esc(answer === UNSURE ? "" : answer) +
          '">') +
      option(UNSURE, "I’m not sure yet") +
      '</fieldset><p class="quiz-error" role="alert"></p><div class="actions">' +
      (i ? control("Back", "secondary", "data-back") : "") +
      '<button class="btn primary">' +
      (i === items.length - 1 ? "See my practice plan" : "Next question") +
      '</button></div></form><p class="quiz-foot">Your answers save in this browser. <a href="#/practice">Pause quiz</a></p>';
    const form = area.querySelector("form");
    form.oninput = (e) => {
      const input = e.target;
      if (input.id === "numeric")
        form.querySelector('[value="unsure"]').checked = false;
      else if (!item.options) form.querySelector("#numeric").value = "";
      draft.answers[item.id] = input.value;
      set({ draft });
      form.querySelector(".quiz-error").textContent = "";
    };
    area.querySelector("[data-back]")?.addEventListener("click", () => {
      set({ draft: { ...draft, index: i - 1 } });
      draw(true);
    });
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!validAnswer(item, draft.answers[item.id])) {
        form.querySelector(".quiz-error").textContent = item.options
          ? "Choose an answer, or select “I’m not sure yet.”"
          : "Enter a number, or select “I’m not sure yet.”";
        form.querySelector("input").focus();
        return;
      }
      if (i === items.length - 1) {
        const profile = completeQuiz(draft);
        if (profile) set({ profile, draft: null });
        else
          set({
            draft: {
              ...draft,
              index: items.findIndex(
                (q) => !validAnswer(q, draft.answers[q.id]),
              ),
            },
          });
      } else set({ draft: { ...draft, index: i + 1 } });
      draw(true);
    };
  }
  function readable(q, value) {
    return value === UNSURE
      ? "I’m not sure yet"
      : q.options
        ? q.options[Number(value)]
        : value + q.unit;
  }
  function results(area, profile) {
    const next = planFor(profile, state.attempts)[0];
    area.innerHTML =
      '<span class="kicker">YOUR QUIZ RESULTS</span><h1>Your practice plan</h1><p class="quiz-lede">Here’s what your answers suggest across the three paths. Each path draws on just three questions. Your work in the studio will give you a fuller picture.</p>' +
      (next
        ? '<article class="quiz-next"><span class="kicker">START HERE</span><h2>' +
          esc(nameFor(next.id)) +
          "</h2><p>" +
          esc(next.reason) +
          "</p>" +
          link("Open recommended activity", routeFor(next.id), "primary") +
          "</article>"
        : "<p>You’ve passed every activity in this plan. Revisit any lab from your practice home.</p>") +
      "<h2>How you did on each path</h2>" +
      paths
        .map((path) => {
          const qs = items.filter((q) => q.path === path.id);
          const count = qs.filter(
            (q) => outcome(q, profile.answers[q.id]) === "correct",
          ).length;
          return (
            '<details class="quiz-breakdown"><summary>' +
            icon(path.icon) +
            "<span>" +
            path.title +
            "</span><strong>" +
            count +
            " of " +
            qs.length +
            " correct</strong></summary>" +
            qs
              .map((q) => {
                const value = profile.answers[q.id],
                  status = outcome(q, value);
                return (
                  "<section><strong>" +
                  esc(q.skill) +
                  "</strong><p>" +
                  esc(q.context) +
                  "</p><p><b>" +
                  esc(q.prompt) +
                  "</b></p><p>Your answer · " +
                  esc(readable(q, value)) +
                  " (" +
                  { correct: "correct", missed: "incorrect", unsure: "unsure" }[
                    status
                  ] +
                  ")</p>" +
                  (status !== "correct"
                    ? "<p>Correct answer · " +
                      esc(readable(q, q.answer)) +
                      "</p>"
                    : "") +
                  "<p>" +
                  esc(q.why) +
                  '</p><a href="#' +
                  routeFor(q.lesson) +
                  '">Practice this skill</a></section>'
                );
              })
              .join("") +
            "</details>"
          );
        })
        .join("") +
      '<div class="quiz-foot actions">' +
      link("Go to practice", "/practice") +
      control(
        get().draft ? "Resume your retake" : "Retake quiz",
        "secondary",
        "data-retake",
      ) +
      "</div>";
    area.querySelector("[data-retake]").onclick = () => {
      showPrevious = false;
      set({ draft: get().draft || newQuiz(profile.goal) });
      if (location.hash === "#/placement/results") location.hash = "/placement";
      else draw(true);
    };
  }
  draw();
}
