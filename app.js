import { paths, icon, artwork } from "./art.js";
import { lessons, renderLesson } from "./lessons.js";
import { restore, record, event, storageKey } from "./store.js";
import { planFor, renderPlacement } from "./placement.js";
import markUrl from "./mark.svg?url";
import "./lessons.css";
import "./labs.css";
import "./placement.css";
const main = document.querySelector("main");
/** @param {string} selector @returns {HTMLElement} */
const ui = (selector) => document.querySelector(selector);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let raw;
try {
  raw = localStorage.getItem(storageKey);
} catch {}
const state = restore(raw);
function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    document.querySelector("#storage-alert").textContent =
      "Browser storage is unavailable. This session is in memory. Export your work before closing.";
  }
}
const stamp = Date.now();
if (!state.visits.length || stamp - state.visits.at(-1) > 1800000) {
  if (state.visits.length) event(state, "return_visit");
  state.visits.push(stamp);
  persist();
}
function track(type, id = "") {
  event(state, type, id);
  persist();
}
const routeFor = (id) =>
  "/" + (paths.some((p) => p.lab === id) ? "lab/" : "lesson/") + id;
const nameFor = (id) =>
  lessons.find((l) => l.id === id)?.title ||
  paths.find((p) => p.lab === id)?.project ||
  id;
const logo =
  '<img src="' +
  markUrl +
  '" alt="" width="36" height="36"><span>Praxifold</span>';
const btn = (text, route, cls = "primary", ic = "") =>
  `<a class="btn ${cls}" href="#${route}">${ic ? icon(ic) : ""}${text}</a>`;
function themeBtn() {
  const dark = document.documentElement.classList.contains("dark");
  return `<button class="theme iconbutton" aria-label="Switch to ${dark ? "light" : "dark"} mode">${icon(dark ? "moon" : "sun")}</button>`;
}
function quizLabel() {
  if (state.placement?.draft) return "Resume placement quiz";
  if (state.placement?.profile) return "View quiz results";
  return "Take the placement quiz";
}
function nav(page) {
  const links = [
    ["practice", "Practice"],
    ["map", "Skill map"],
    ["review", "Review"],
    ["portfolio", "Portfolio"],
  ];
  const anchor = ([url, label]) =>
    `<a ${page === url ? 'aria-current="page"' : ""} href="#/${url}">${label}</a>`;
  document.querySelector("#nav").innerHTML =
    `<div class="navinner"><a class="brand" href="#/" aria-label="Praxifold home">${logo}</a><nav class="desktopnav" aria-label="Practice navigation">${links.map(anchor).join("")}</nav><div class="navend">${anchor(["plans", "Plans"])}${themeBtn()}${page === "placement" ? "" : btn(state.placement?.profile ? "My practice" : "Start free", state.placement?.profile ? "/practice" : "/placement", "primary small")}<button class="iconbutton mobilemenu" aria-label="Open navigation" aria-expanded="false">${icon("menu")}</button></div></div><nav class="mobilelinks" hidden aria-label="Mobile navigation">${[...links, ["plans", "Plans"]].map(anchor).join("")}</nav>`;
  ui(".theme").onclick = () => {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("pf-theme", dark ? "dark" : "light");
    } catch {}
    nav(page);
    ui(".theme").focus();
  };
  ui(".mobilemenu").onclick = (e) => {
    const el = ui(".mobilelinks");
    el.hidden = !el.hidden;
    ui(".mobilemenu").setAttribute("aria-expanded", String(!el.hidden));
    ui(".mobilemenu").setAttribute(
      "aria-label",
      el.hidden ? "Open navigation" : "Close navigation",
    );
  };
  document.querySelector("#footer").innerHTML =
    `<div class="footinner"><a class="brand" href="#/">${logo}</a><span>PRACK-see-fold</span><div><a href="#/practice">Practice</a><a href="#/plans">Plans</a></div></div>`;
}
const intro = (k, title, desc) =>
  `<div class="pageintro"><span class="kicker">${k}</span><h1>${title}</h1><p>${desc}</p></div>`;
function pathCards(toLab = false) {
  return `<div class="pathgrid">${paths.map((p) => `<a class="pathcard" href="#/${toLab ? "lab/" + p.lab : "map/" + p.id}">${artwork(p.id)}<div class="cardcopy"><h3>${toLab ? p.project : p.title}</h3><p>${toLab ? p.title : p.desc}</p><span class="cardlink">${toLab ? "Open lab" : "Explore path"} ${icon("up", 14)}</span></div></a>`).join("")}</div>`;
}
function heroExample() {
  return `<div class="example-stage"><div class="backsheet"></div><article class="example"><div class="exhead"><span>${icon("flask", 16)} LAB PREVIEW</span><span class="exdots" aria-hidden="true">•••</span></div><div class="exbody"><div class="example-meta">Make a launch decision</div><h2>One metric, two stories.</h2><figure class="chart"><figcaption>Account activation rate</figcaption><div class="chartrow"><span>Raw rows</span><div><i style="--w:32%" class="rawbar"></i><b>16%</b></div></div><div class="chartrow"><span>Eligible cohort</span><div><i style="--w:80%"></i><b>40%</b></div></div><div class="axis"><span>0%</span><span>25%</span><span>50%</span></div></figure><div class="coach"><span class="checkcircle">${icon("check", 14)}</span><div><strong>You found the denominator error.</strong><p>32 of 80 eligible accounts activated. The dashboard counted all 200 rows.</p></div></div></div><div class="exfoot">${icon("file", 14)} <span>foldline-pilot-accounts.csv</span><span>200 rows</span></div></article></div>`;
}
function landing() {
  main.innerHTML = `<section class="heroband"><div class="hero bounds"><div class="hero-copy"><span class="studio-label"><i></i> AI PRACTICE STUDIO</span><h1>Learn AI by<br>doing <em>the work.</em></h1><p>Make better decisions, build useful systems, and understand the models behind them.</p><div class="heroactions">${btn("Try a challenge", "/lesson/d1", "primary", "play")}${btn("Start with a lab", "/labs", "secondary", "flask")}</div><div class="guestnote"><span class="smallcheck">${icon("check", 13)}</span> Free to practice <b>·</b> No account required</div><p class="quiz-entry"><a href="#/placement">${quizLabel()}</a></p></div>${heroExample()}</div></section><section class="bounds pathsection"><div class="sectionline"><div><span class="kicker">LEARNING PATHS</span><h2>Three ways to practice</h2></div><a class="textlink" href="#/map">View skill map ${icon("map", 16)}</a></div>${pathCards()}</section>`;
}
function practice() {
  const done = new Set(state.attempts.filter((a) => a.passed).map((a) => a.id)),
    due = Object.values(state.reviews).filter(
      (r) => r.due <= Date.now(),
    ).length;
  const profile = state.placement?.profile;
  const next = planFor(profile, state.attempts)[0];
  const last = state.last;
  const unfinished = last && !state.drafts[last]?.result?.passed && !state.drafts[last]?.assessment?.passed;
  const continuing = unfinished && (!next || next.id === last);
  const id = continuing ? last : next?.id || lessons.find(l => !done.has(l.id))?.id || "launch";
  const startQuiz = !profile && (!last || state.placement?.draft);
  const label = startQuiz ? (state.placement?.draft ? "PICK UP YOUR QUIZ" : "NEW HERE?") : continuing ? "CONTINUE PRACTICING" : "YOUR NEXT ACTIVITY";
  const title = startQuiz ? (state.placement?.draft ? "Your quiz is right where you left it." : "Find your starting point.") : nameFor(id);
  const message = startQuiz ? "Try nine everyday AI decisions. We’ll use your answers to suggest a drill or lab that fits." : continuing ? "Pick up where you left off. Your work is saved in this browser." : next?.reason || "Choose a challenge and check your reasoning against the evidence.";
  const quizLink = profile ? '<a href="#/placement/results">See your quiz results</a>' : '<a href="#/placement">'+quizLabel()+'</a>';
  main.innerHTML = `<div class="bounds page">${intro("PRACTICE HOME", "Your practice studio", "Pick up your work or explore a different path.")}<article class="nextpanel"><div><span class="kicker">${label}</span><h2>${esc(title)}</h2><p>${esc(message)}</p>${btn(startQuiz ? quizLabel() : continuing ? "Continue practice" : "Open activity", startQuiz ? "/placement" : routeFor(id))}</div><div class="summary"><p><strong>${done.size}</strong> of 16 activities passed</p><a href="#/review">${due} reviews due</a><p>${startQuiz ? '<a href="#/lesson/d1">Go straight to a challenge</a>' : quizLink}</p>${unfinished && last !== id ? `<a href="#${routeFor(last)}">Resume ${esc(nameFor(last))}</a>` : ""}</div></article><div class="sectionline"><h2>Start with a lab</h2><a href="#/map">All exercises</a></div>${pathCards(true)}<div class="caplink">${icon("file")}<div><strong>Mini-capstone</strong><p>Transfer your skills to a fresh event attendance brief.</p></div>${btn("Open capstone", "/lesson/capstone", "secondary")}</div></div>`;
}
const future = {
  use: ["Multimodal research and creative direction", "Prototype and critique a finished work product"],
  build: ["Grounded retrieval and structured API outputs", "MCP tools, state and agent handoffs"],
  understand: ["Tokens, sampling and embeddings", "Attention and model adaptation"],
};
const preparation = {
  use: "Practice tracing claims and checking denominators before drafting a launch recommendation.",
  build: "Practice source selection and completion gates before repairing the weekly briefing.",
  understand: "Practice leakage checks and baseline comparisons before evaluating the classifier."
};
function skillmap(filter) {
  const chosen = paths.find((p) => p.id === filter);
  const recommended = planFor(state.placement?.profile, state.attempts)[0]?.id;
  main.innerHTML = `<div class="bounds page">${intro("SKILL MAP", "Find your next challenge", "Start with a drill, apply the skill in a lab, then test it on a fresh case.")}<div class="filters">${[["", "All paths"], ...paths.map((p) => [p.id, p.title])].map(([key, val]) => `<a ${(chosen?.id || "") === key ? 'aria-current="true"' : ""} href="#/map${key ? "/" + key : ""}">${val}</a>`).join("")}</div>${(chosen
    ? [chosen]
    : paths
  )
    .map(
      (p) =>
        `<section class="mapgroup"><span class="pathicon ${p.id}">${icon(p.icon)}</span><h2>${p.title}</h2><p class="path-prep">${preparation[p.id]}</p>${[
          ...lessons.filter((l) => l.path === p.id && l.id !== "capstone"),
          { id: p.lab, title: p.project },
        ]
          .map((l) => {
            const a = state.attempts.filter((a) => a.id === l.id),
              demo = a.find((a) => a.demonstrated);
            return `<div class="maprow"><a href="#${routeFor(l.id)}"><span class="maptype">${l.id === p.lab ? "Lab" : "Drill"}</span>${esc(l.title)}${l.id === recommended ? '<strong class="quiz-map-label">Suggested for you</strong>' : ""}</a>${demo ? `<a href="#/portfolio/${demo.uid}">✓ Demonstrated</a>` : `<small>${a.length ? "◐ Attempted" : state.drafts[l.id] ? "◐ In progress" : "○ Available"}</small>`}</div>`;
          })
          .join(
            "",
          )}${future[p.id].map(topic => `<div class="maprow planned"><span>${topic}</span><small>◇ Planned</small></div>`).join('')}<p class="mapnote">These lessons are in development. Practice the foundation in <a href="#/lab/${p.lab}">${p.project}</a>.</p></section>`,
    )
    .join(
      "",
    )}<div class="caplink">${icon("file")}<div><strong>Mini-capstone · Transfer across paths</strong><p>Recommended preparation · Complete a lab in each path.</p>${state.attempts.some((a) => a.id === "capstone" && a.demonstrated) ? '<a href="#/portfolio/' + state.attempts.find((a) => a.id === "capstone" && a.demonstrated).uid + '">✓ Demonstrated · View evidence</a>' : ""}</div>${btn("Open capstone", "/lesson/capstone", "secondary")}</div></div>`;
}
function review() {
  const rows = Object.entries(state.reviews).sort(
    (a, b) => a[1].due - b[1].due,
  );
  main.innerHTML = `<div class="bounds page">${intro("REVIEW QUEUE", "Revisit a skill", "Missed checks return here. A successful retry moves your next review out by seven days.")}${rows.length ? rows.map(([id, r]) => `<article class="reviewrow"><div><small>${r.due <= Date.now() ? "Due now" : "Review " + new Date(r.due).toLocaleDateString()}</small><h2>${esc(nameFor(id))}</h2><p>${esc(r.reason)}</p></div>${btn("Revisit exercise", routeFor(id), "secondary")}</article>`).join("") : `<div class="empty">${icon("clock", 32)}<h2>Your review queue is clear</h2><p>Try a challenge. Any missed check will appear here with a reason to revisit it.</p>${btn("Try a challenge", "/lesson/d1")}</div>`}</div>`;
}
const human = (k) => k.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
function evidence(v) {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v))
    return `<ul>${v.map((i) => "<li>" + evidence(i) + "</li>").join("")}</ul>`;
  if (typeof v === "object")
    return `<dl>${Object.entries(v)
      .map(([k, val]) => `<dt>${esc(human(k))}</dt><dd>${evidence(val)}</dd>`)
      .join("")}</dl>`;
  return esc(v);
}
function artifactPreview(a) {
  const w = a.work;
  const summary =
    w.recommendation ||
    w.decision ||
    w.run?.brief ||
    w.interpretation ||
    w.draft ||
    "Saved response";
  const sources = Array.isArray(w.sourcePack) ? w.sourcePack : [];
  const chart = w.chart;
  return `<section class="work-preview"><span class="kicker">SUBMITTED WORK</span><p>${esc(summary)}</p>${chart ? `<strong>${esc(chart.percent)}% activated</strong><p>${esc(chart.numerator)} of ${esc(chart.denom)} accounts in the selected cohort.</p>` : ""}${w.forecast !== undefined ? `<b>Forecast · ${esc(w.forecast)} attendees</b>` : ""}</section>${sources.length ? `<section class="supporting"><h3>Supporting evidence</h3>${sources.map((v) => `<details><summary>${esc(v.id)} · ${esc(v.title)}</summary><p>${esc(v.date || "")} ${esc(v.body)}</p></details>`).join("")}</section>` : ""}`;
}
function portfolio(uid) {
  const entries = [...state.artifacts].reverse(),
    a = entries.find((a) => a.uid === uid) || entries[0];
  main.innerHTML = `<div class="bounds page">${intro("PORTFOLIO", "Your work, with evidence", "Reopen a saved attempt, inspect its checks, or export the work as JSON.")}${a ? `<div class="portfolio"><aside><h2>Saved attempts</h2>${entries.map((x) => `<a class="artifactlink" ${x.uid === a.uid ? 'aria-current="true"' : ""} href="#/portfolio/${x.uid}">${esc(x.title)}<small>${new Date(x.at).toLocaleString()} · ${x.score}%</small></a>`).join("")}</aside><article><span class="kicker">SAVED ARTIFACT</span><h2>${esc(a.title)}</h2><p>${a.score}% on objective checks · ${state.attempts.find((v) => v.uid === a.uid)?.demonstrated ? "Fresh unaided demonstration" : "Practice attempt"}</p>${artifactPreview(a)}<details><summary>Complete artifact data</summary>${evidence(a.work)}</details><details><summary>Grading and self-review</summary>${evidence(a.rubric)}</details><div class="actions"><button class="btn primary" id="export">Export artifact</button>${btn("Reopen exercise", routeFor(a.id), "secondary")}</div><p><a href="#/practice">Continue practicing</a> · <a href="#/plans">View future project packs</a></p></article></div>` : `<div class="empty">${icon("file", 32)}<h2>Your first artifact starts with a decision</h2><p>Submit an exercise to save your answer, the source evidence and your result here.</p>${btn("Try a challenge", "/lesson/d1")}</div>`}</div>`;
  if (a)
    ui("#export").onclick = () => {
      const blob = new Blob(
          [
            JSON.stringify(
              {
                version: 1,
                ...a,
                attempt: state.attempts.find((v) => v.uid === a.uid),
              },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        ),
        url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = "praxifold-" + a.id + "-" + a.uid + ".json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      track("artifact_export", a.id);
    };
}
const plans = [
  {
    name: "Private beta",
    status: "Available today",
    price: "Free",
    text: "Practice across all three paths in this browser.",
    items: [
      "12 drills with feedback and retries",
      "Three signature labs and a fresh-case mini-capstone",
      "Review queue, saved work and artifact exports",
    ],
  },
  {
    name: "Founding cohort",
    status: "Planned · Private preview",
    price: "Human-reviewed projects",
    text: "Our first paid experiment pairs deeper briefs with an independent review of your work.",
    items: [
      "A decision memo, a verified agent run and a model audit",
      "Rubrics covering source quality, verification and transfer",
      "Reviewer comments and a second submission",
    ],
  },
];
function showPlans() {
  main.innerHTML = `<div class="bounds page">${intro("PLANS", "Practice today. Go deeper over time.", "The private beta is free. Future Pro project packs will add fresh cases and optional live labs.")}<div class="plans">${plans.map((p, i) => `<article><span class="kicker">${p.status}</span><h2>${p.name}</h2><h3>${p.price}</h3><p>${p.text}</p><ul>${p.items.map((v) => "<li>" + icon("check", 16) + v + "</li>").join("")}</ul>${i ? '<p class="muted">Enrollment is closed. Pricing and demand are being tested.</p>' : btn("Start free", "/lesson/d1")}</article>`).join("")}</div></div>`;
}
let sequence = 0;
async function render() {
  const seq = ++sequence,
    [page = "", id = ""] = location.hash.replace(/^#\/?/, "").split("/");
  nav(page);
  document.title =
    (page
      ? (page === "placement" ? "AI placement quiz" : nameFor(id)) || page.charAt(0).toUpperCase() + page.slice(1)
      : "AI practice studio") + " · Praxifold";
  if (page === "lesson" || page === "lab") {
    if (
      (page === "lesson" && !lessons.some((l) => l.id === id)) ||
      (page === "lab" && !paths.some((p) => p.lab === id))
    ) {
      main.innerHTML =
        '<div class="bounds page"><h1>Exercise unavailable</h1><a href="#/map">Open skill map</a></div>';
      return;
    }
    state.last = id;
    if (!state.events.some((e) => e.type === "first_start"))
      track("first_start", id);
    persist();
    const api = {
      esc,
      draft: () => state.drafts[id] || {},
      nextRoute: () => {const step = planFor(state.placement?.profile, state.attempts)[0];return step && step.id !== id ? "#"+routeFor(step.id) : null},
      save: (obj) => {
        state.drafts[id] = obj;
        persist();
      },
      finish: (r) => {
        const failed = Array.isArray(r.rubric)
          ? r.rubric.find((c) => c.pass === false)
          : null;
        record(state, id, { ...r, reason: failed?.detail || r.reason });
        persist();
      },
    };
    if (page === "lesson") renderLesson(id, main, api);
    else {
      main.innerHTML =
        '<div class="bounds page" role="status">Opening lab…</div>';
      try {
        const { renderLab } = await import("./labs.js");
        if (seq === sequence) renderLab(id, main, api);
      } catch (err) {
        console.error(err);
        main.innerHTML =
          '<div class="bounds page" role="alert">The lab could not open. <button class="btn secondary" onclick="location.reload()">Retry</button></div>';
      }
    }
  } else if (page === "placement") renderPlacement(main, state, {save:persist, esc, nameFor, routeFor}, id === "results");
  else if (page === "practice") practice();
  else if (page === "map") skillmap(id);
  else if (page === "review") {
    track("review_use");
    review();
  } else if (page === "portfolio") portfolio(id);
  else if (page === "plans") {
    track("plan_view");
    showPlans();
  } else if (page === "labs")
    main.innerHTML = `<div class="bounds page">${intro("SIGNATURE LABS", "Start with a lab", "Choose a working brief. Inspect the evidence, test a change and save a result you can defend.")}${pathCards(true)}</div>`;
  else landing();
  if (seq === sequence) main.dataset.route = location.hash.slice(2);
}
window.addEventListener("hashchange", () => {
  render();
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
});
ui(".skip").onclick = (e) => {
  e.preventDefault();
  main.focus();
};
render();
