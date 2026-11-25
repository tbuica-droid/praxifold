/** @typedef {{id:string,eligible:boolean,activated:boolean,team:string}} Account */
/** @typedef {{id:string,title:string,date:string,body:string}} Source */
/** @typedef {'launch'|'agent'|'model'} LabId */

function random(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function shuffle(items, rand) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
/** @returns {Account[]} */
export function accounts() {
  const rng = random(2102);
  const records = Array.from({ length: 198 }, (_, i) => ({
    id: "AC-" + String(i + 1).padStart(3, "0"),
    eligible: i < 80,
    activated: i < 32,
    team: ["Design", "Operations", "Product"][Math.floor(rng() * 3)],
  }));
  return shuffle([...records, { ...records[153] }, { ...records[188] }], rng);
}
export function activation(rows, cohort) {
  const unique = [...new Map(rows.map((r) => [r.id, r])).values()];
  const numerator = unique.filter((r) => r.eligible && r.activated).length;
  const denom = {
    rows: rows.length,
    unique: unique.length,
    eligible: unique.filter((r) => r.eligible).length,
  }[cohort];
  if (!denom) throw new Error("Choose a nonempty cohort.");
  return {
    numerator,
    denom,
    percent: Number(((100 * numerator) / denom).toFixed(1)),
  };
}
const interviewText = [
  [
    "Mira · Design lead",
    "I made our first shared board in the workshop. Three teammates used it the next day. I would bring in another team if permissions were easier to explain.",
  ],
  [
    "Leon · Studio owner",
    "Our invitation came Friday. I logged in to browse, but the workspace stayed read-only all week. We never had the option to publish.",
  ],
  [
    "Sal · Operations lead",
    "The template got us started. I had to ask support how to invite a reviewer before I could publish our first board.",
  ],
  [
    "Jules · Product designer",
    "We shipped a client board in an afternoon. The handoff checklist saved me a second round of messages.",
  ],
  [
    "Noor · Research manager",
    "Our team received two welcome emails after the import. Both links opened the same account.",
  ],
  [
    "Kit · Agency producer",
    "I could create a workspace on Monday. The project did not fit our current client, so I left it empty. I would try a narrower template.",
  ],
];
/** @type {Source[]} */
const launchSources = [
  {
    id: "DASH-01",
    title: "Pilot dashboard · Activation",
    date: "2026-04-30",
    body: "The month-end dashboard reports 32 activations across 200 imported rows. Its headline is “16% activated.” Each row records an import, including repeat imports and read-only teams.",
  },
  {
    id: "COHORT-02",
    title: "Pilot access policy and seven-day activation measurement contract",
    date: "2026-04-01",
    body: "Count each account once. An eligible team had publishing access for seven full days. Activation means that the account published its first shared board during that window. The expansion threshold is 35% among eligible accounts.",
  },
  ...interviewText.map(([title, body], i) => ({
    id: "INT-0" + (i + 1),
    title,
    date: "2026-04-" + (21 + i),
    body,
  })),
];
/** @type {Source[]} */
const agentSources = [
  {
    id: "POL-01",
    title: "Travel policy · January edition",
    date: "2026-01-08",
    body: "Archived policy. Reimbursement ceiling was $90 per night. Superseded by POL-02.",
  },
  {
    id: "POL-02",
    title:
      "Finance-approved overnight travel reimbursement policy for field teams",
    date: "2026-04-12",
    body: "Approved by Finance. Reimbursement ceiling is $120 per night from April 12. Exceptions require written approval. This edition supersedes POL-01.",
  },
  {
    id: "OPS-03",
    title: "Weekly operations bulletin",
    date: "2026-04-15",
    body: "Operations confirmed that receipt upload remains mandatory. The incomplete file pack deliberately omits this bulletin.",
  },
];
/** A bounded in-memory replay. Only manifest reads and source lookups exist. */
export function replay({ pack, selection, review }) {
  const events = [];
  const event = (title, status, detail) =>
    events.push({ title, status, detail });
  event(
    "Open weekly brief",
    "Read",
    "Permissions: read_manifest and read_source. No external requests or document writes. Required fields: overnight ceiling and receipt requirement.",
  );
  if (pack === "unreadable") {
    event(
      "Read source pack",
      "Failed",
      "read_manifest returned PACK_UNREADABLE. No brief was generated. Select an intact pack and rerun. This technical failure has no grade.",
    );
    return { status: "Failed", events, brief: "", selection, review, pack };
  }
  const docs = pack === "missing" ? agentSources.slice(0, 2) : agentSources;
  const policies = docs.filter((d) => d.id.startsWith("POL"));
  const chosen =
    selection === "latest"
      ? policies.toSorted((a, b) => b.date.localeCompare(a.date))[0]
      : policies[0];
  event(
    "Select policy source",
    chosen.id === "POL-02" ? "Current" : "Obsolete",
    chosen.id + " · " + chosen.date + " · " + chosen.body,
  );
  const ops = docs.find((d) => d.id === "OPS-03");
  event(
    "Read operations bulletin",
    ops ? "Found" : "Missing",
    ops
      ? ops.id + " · " + ops.date + " · " + ops.body
      : "OPS-03 was requested. Source lookup returned zero documents. The receipt requirement is unverified.",
  );
  const manifest = docs
    .map(
      (doc) => doc.id + " · " + doc.date + " · " + doc.title + " — " + doc.body,
    )
    .join("\n");
  event("Inspect source manifest", "Replay data", manifest);
  const stale = chosen.id === "POL-01";
  const status =
    review === "guard" && (!ops || stale)
      ? "Paused for review"
      : stale || !ops
        ? "Invalid brief"
        : "Valid brief";
  const brief =
    "Nightly ceiling: " +
    (stale ? "$90" : "$120") +
    " [" +
    chosen.id +
    "]. " +
    (ops ? "Upload receipts [OPS-03]." : "Receipt requirement unverified.");
  event(
    "Apply completion rule",
    status,
    status === "Paused for review"
      ? "Held for a reviewer. " +
          (!ops
            ? "Supply the missing operations bulletin."
            : "Replace the superseded policy.")
      : (status === "Invalid brief"
          ? "Marked complete with an unresolved evidence problem. "
          : "All required checks passed. ") + brief,
  );
  return { status, brief, events, selection, review, pack };
}
/** @type {Source[]} */
const modelSources = [
  {
    id: "FEATURE-01",
    title: "Preview sessions",
    date: "At invitation",
    body: "Count of product preview sessions before invitation. Available when the model must predict a team’s first-week activation.",
  },
  {
    id: "FEATURE-02",
    title: "Team size",
    date: "At invitation",
    body: "Number of members listed on the invitation. Available before activation.",
  },
  {
    id: "FEATURE-03",
    title: "Published-board receipt",
    date: "After the outcome",
    body: "Receipt flag created when the first board is published. It directly records the outcome the model is meant to predict.",
  },
  {
    id: "SPLIT-04",
    title: "Evaluation split",
    date: "Seed 417",
    body: "One row per team. Shuffle 160 synthetic teams with seed 417. Train on the first 120. Score the same untouched 40 teams on every run. The baseline always predicts the training set’s majority class.",
  },
];
export function modelData() {
  const rng = random(518);
  const rows = Array.from({ length: 160 }, (_, i) => {
    const sessions = Math.floor(rng() * 9),
      team = Math.floor(rng() * 12) + 1;
    const label = Number(rng() < 0.08 + 0.062 * sessions + 0.016 * team);
    return {
      id: "TEAM-" + String(i + 1).padStart(3, "0"),
      sessions,
      team,
      receipt: label,
      label,
    };
  });
  const shuffled = shuffle(rows, random(417));
  return { train: shuffled.slice(0, 120), test: shuffled.slice(120) };
}
function majority(rows) {
  return Number(rows.filter((r) => r.label === 1).length > rows.length / 2);
}
/** Fit a one-split decision tree by maximizing training accuracy. */
export function trainModel(includeReceipt, data = modelData()) {
  const { train, test } = data;
  if (!train.length || !test.length)
    throw new Error("Training and evaluation each need a nonempty split.");
  const baseline = majority(train);
  let rule = {
      feature: "constant",
      threshold: 0,
      left: baseline,
      right: baseline,
    },
    best = train.filter((r) => r.label === baseline).length;
  for (const feature of includeReceipt
    ? ["sessions", "team", "receipt"]
    : ["sessions", "team"]) {
    for (const threshold of [...new Set(train.map((r) => r[feature]))].sort(
      (a, b) => a - b,
    )) {
      const lo = train.filter((r) => r[feature] <= threshold),
        hi = train.filter((r) => r[feature] > threshold);
      if (!lo.length || !hi.length) continue;
      const left = majority(lo),
        right = majority(hi);
      const score =
        lo.filter((r) => r.label === left).length +
        hi.filter((r) => r.label === right).length;
      if (score > best) {
        best = score;
        rule = { feature, threshold, left, right };
      }
    }
  }
  const matrix = [
      [0, 0],
      [0, 0],
    ],
    errors = [];
  for (const row of test) {
    const predicted =
      rule.feature === "constant" || row[rule.feature] <= rule.threshold
        ? rule.left
        : rule.right;
    matrix[row.label][predicted]++;
    if (predicted !== row.label) errors.push({ ...row, predicted });
  }
  const correct = matrix[0][0] + matrix[1][1];
  return {
    rule,
    matrix,
    errors,
    correct,
    total: test.length,
    baselineCorrect: test.filter((r) => r.label === baseline).length,
    includeReceipt,
    trainSize: train.length,
  };
}
/** @type {Record<LabId,{path:string,title:string,intro:string,sources:Source[],prediction:string,options:string[],next:string,nextTitle:string,hint:string}>} */
const labDefs = {
  launch: {
    path: "Use AI well",
    title: "Make a launch decision",
    intro:
      "Foldline’s pilot dashboard shows 16% activation. The founders need an expansion decision before Monday. Audit the number and recommend the next move.",
    sources: launchSources,
    prediction: "Which part of the dashboard would you check first?",
    options: [
      "The denominator",
      "The number of activations",
      "The expansion threshold",
    ],
    next: "#/lab/agent",
    nextTitle: "Repair a research assistant",
    hint: "Check the access policy. Which teams had a full opportunity to publish a board?",
  },
  agent: {
    path: "Build with AI",
    title: "Repair a research assistant",
    intro:
      "A weekly briefing agent quoted an old travel policy and finished with a source missing. Replay its decisions, repair the rules, and test them against two file packs.",
    sources: agentSources,
    prediction: "Which failure can a completion gate catch?",
    options: [
      "A missing required source",
      "A slow file read",
      "An ambiguous writing style",
    ],
    next: "#/lab/model",
    nextTitle: "Investigate a suspicious classifier",
    hint: "Use the latest approved policy. Make completion depend on every required source, then test both packs.",
  },
  model: {
    path: "Understand models",
    title: "Investigate a suspicious classifier",
    intro:
      "A model claims it can predict which teams will activate before they receive an invitation. Inspect the timing of its inputs, train it, and test the claim on held-out teams.",
    sources: modelSources,
    prediction: "What will happen when you remove the receipt field?",
    options: [
      "Held-out accuracy will fall",
      "Accuracy will stay the same",
      "Accuracy will improve",
    ],
    next: "#/lesson/capstone",
    nextTitle: "Try the fresh-case capstone",
    hint: "Ask whether each field exists at invitation time. Train once with the receipt and once without it.",
  },
};
const features = {
  sessions: "Preview sessions",
  team: "Team size",
  receipt: "Published-board receipt",
  constant: "Training majority",
};
const field = (name, label, control) =>
  '<label class="lab-field"><span>' + label + "</span>" + control + "</label>";
const options = (values, current) =>
  values
    .map(
      ([val, label]) =>
        '<option value="' +
        val +
        '"' +
        (val === current ? " selected" : "") +
        ">" +
        label +
        "</option>",
    )
    .join("");
const select = (name, items, value) =>
  '<select data-field="' + name + '">' + options(items, value) + "</select>";
const button = (action, label, variant = "secondary") =>
  '<button type="button" data-action="' +
  action +
  '" class="btn ' +
  variant +
  '">' +
  label +
  "</button>";
const labTitles = {
  launch: "Decision brief",
  agent: "Replay report",
  model: "Model audit",
};
const launchCohorts = [
  ["rows", "All imported rows"],
  ["unique", "All unique accounts"],
  ["eligible", "Eligible unique accounts"],
];
const labClaim = (id, selected) =>
  '<button type="button" class="lab-cite" data-cite="' +
  id +
  '" aria-pressed="' +
  (selected === id) +
  '">' +
  id +
  "</button>";
const percent = (a, b) => Number(((100 * a) / b).toFixed(1)) + "%";
function chart(bars) {
  return (
    '<figure class="lab-chart"><figcaption>Activation rate <span>Accounts activated (%)</span></figcaption>' +
    bars
      .map(
        ([label, n]) =>
          '<div class="lab-bar-label">' +
          label +
          " <strong>" +
          n +
          '%</strong></div><div class="lab-bar-track"><i style="width:' +
          n +
          '%"></i></div>',
      )
      .join("") +
    '<div class="lab-axis"><span>0%</span><span>50%</span><span>100%</span></div></figure>'
  );
}
function trace(run) {
  return (
    '<div class="lab-trace">' +
    run.events
      .map(
        (ev, i) =>
          '<details><summary><span class="lab-event-number">' +
          String(i + 1).padStart(2, "0") +
          "</span><span>" +
          ev.title +
          "</span><small>" +
          ev.status +
          "</small></summary><p>" +
          ev.detail +
          "</p></details>",
      )
      .join("") +
    "</div>"
  );
}
function metrics(result) {
  const { matrix: m, rule: r } = result;
  const learned =
    r.feature === "constant"
      ? "Always predict the training majority."
      : "If " +
        features[r.feature].toLowerCase() +
        " ≤ " +
        r.threshold +
        ", predict " +
        r.left +
        ". Otherwise predict " +
        r.right +
        ".";
  return (
    '<div class="lab-metrics"><article><small>Held-out accuracy</small><strong>' +
    percent(result.correct, result.total) +
    "</strong><span>" +
    result.correct +
    " / " +
    result.total +
    " correct</span></article><article><small>Majority baseline</small><strong>" +
    percent(result.baselineCorrect, result.total) +
    "</strong><span>" +
    result.baselineCorrect +
    " / " +
    result.total +
    " correct</span></article></div><p><b>Learned rule.</b> " +
    learned +
    ' Class 1 means activated.</p><table class="lab-table"><caption>Held-out confusion matrix · number of teams</caption><thead><tr><th scope="col">Actual outcome</th><th scope="col">Predicted 0</th><th scope="col">Predicted 1</th></tr></thead><tbody><tr><th scope="row">0 · Inactive</th><td>' +
    m[0][0] +
    "</td><td>" +
    m[0][1] +
    '</td></tr><tr><th scope="row">1 · Activated</th><td>' +
    m[1][0] +
    "</td><td>" +
    m[1][1] +
    '</td></tr></tbody></table><details class="lab-detail"><summary>Inspect errors (' +
    result.errors.length +
    ")</summary>" +
    (result.errors.length
      ? result.errors
          .slice(0, 3)
          .map(
            (e) =>
              "<p><code>" +
              e.id +
              "</code> · " +
              e.sessions +
              " preview sessions, " +
              e.team +
              " members. Predicted " +
              e.predicted +
              ", observed " +
              e.label +
              ".</p>",
          )
          .join("")
      : "<p>Every held-out prediction matched. Inspect when the receipt is created.</p>") +
    "</details>"
  );
}
function launchWork(d, esc) {
  return (
    "<h2>Recalculate activation</h2><p>The dashboard divides 32 activations by 200 imported rows. " +
    labClaim("DASH-01", d.source) +
    "</p>" +
    chart([["Dashboard · raw imports", 16]]) +
    field(
      "cohort",
      "Choose a denominator",
      select("cohort", launchCohorts, d.cohort || "rows"),
    ) +
    button("run", "Recompute rate", "primary") +
    "<hr><h2>Draft your recommendation</h2><p>Use the access policy " +
    labClaim("COHORT-02", d.source) +
    " and at least one interview. Explain a risk and the next observation that would change your decision.</p>" +
    field(
      "decision",
      "Launch decision",
      select(
        "decision",
        [
          ["", "Choose a decision"],
          ["expand", "Expand the pilot"],
          ["hold", "Hold the current pilot"],
          ["narrow", "Run a narrower pilot"],
        ],
        d.decision || "",
      ),
    ) +
    field(
      "memo",
      "Recommendation",
      '<textarea data-field="memo" rows="4" placeholder="I recommend… because…">' +
        esc(d.memo || "") +
        "</textarea>",
    ) +
    field(
      "refs",
      "Source IDs cited",
      '<input data-field="refs" value="' +
        esc(d.refs || "") +
        '" placeholder="COHORT-02, INT-…">',
    ) +
    field(
      "self",
      "Self-review",
      '<span class="lab-check"><input type="checkbox" data-field="self" ' +
        (d.self ? "checked" : "") +
        ">I weighed an interview against the cohort result and gave a condition for revisiting the decision.</span>",
    )
  );
}
function agentWork(d) {
  return (
    '<h2>Repair the harness</h2><p>A harness is the environment and controls that let an agent do and verify work. This replay can read the manifest and three synthetic documents. It can never send or publish a brief.</p><details class="lab-detail"><summary>Inspect the original failed briefing</summary>' +
    trace(replay({ pack: "missing", selection: "first", review: "none" })) +
    "</details>" +
    field(
      "pack",
      "Source pack",
      select(
        "pack",
        [
          ["missing", "Missing operations bulletin"],
          ["complete", "Complete weekly pack"],
          ["unreadable", "Damaged manifest · test recovery"],
        ],
        d.pack || "missing",
      ),
    ) +
    field(
      "selection",
      "Policy selection",
      select(
        "selection",
        [
          ["first", "Take the first matching document"],
          ["latest", "Use the most recent approved policy"],
        ],
        d.selection || "first",
      ),
    ) +
    field(
      "review",
      "Completion rule",
      select(
        "review",
        [
          ["none", "Finish after every lookup returns"],
          ["guard", "Pause on missing or superseded evidence"],
        ],
        d.review || "none",
      ),
    ) +
    button("run", "Run replay", "primary") +
    "<hr><h2>Choose the simpler system</h2><p>Both versions produce the same weekly travel brief. A fixed workflow reads the two required source types and checks their status in order. A bounded agent may choose which missing field to investigate, with a limit of three reads and the same review gate.</p>" +
    field(
      "architecture",
      "For a stable brief with two known source types, use",
      select(
        "architecture",
        [
          ["", "Choose an approach"],
          ["fixed", "A fixed workflow"],
          ["agent", "A bounded tool-using agent"],
        ],
        d.architecture || "",
      ),
    ) +
    '<p class="lab-note">Test the repaired rules on both the complete and missing-bulletin packs before saving.</p>'
  );
}
function modelWork(d) {
  return (
    '<h2>Train a small decision tree</h2><p>Predict first-week activation at invitation time. Training picks the single split that gets the most training examples right. The same 40 held-out teams test every run.</p><fieldset class="lab-fieldset"><legend>Training features</legend><p>Preview sessions and team size are always included.</p><label class="lab-check"><input data-field="receipt" type="checkbox" ' +
    (d.receipt !== false ? "checked" : "") +
    ">Include published-board receipt</label>" +
    labClaim("FEATURE-03", d.source) +
    "</fieldset>" +
    button("run", "Train and evaluate", "primary") +
    "<hr><h2>Interpret the comparison</h2><p>Run the model with and without the receipt before choosing which evaluation can inform an invitation-time decision.</p>" +
    field(
      "interpret",
      "Which result can the team use?",
      select(
        "interpret",
        [
          ["", "Choose an interpretation"],
          ["clean", "The held-out score without the receipt"],
          ["perfect", "The highest held-out score"],
          ["neither", "Neither result because the split is fixed"],
        ],
        d.interpret || "",
      ),
    )
  );
}
function labResults(id, d) {
  const run = d.output;
  if (!run)
    return (
      '<div class="lab-empty"><strong>Your result will appear here.</strong><p>' +
      {
        launch: "Choose the cohort and recompute the chart.",
        agent: "Run a replay and inspect the decision log.",
        model: "Train the tree to see its rule, baseline and errors.",
      }[id] +
      "</p></div>"
    );
  if (id === "launch")
    return (
      chart([
        ["Original dashboard", 16],
        [
          "Revised · " + launchCohorts.find(([v]) => v === run.cohort)[1],
          run.percent,
        ],
      ]) +
      "<p><b>" +
      run.numerator +
      " / " +
      run.denom +
      " = " +
      run.percent +
      "%.</b> " +
      (run.cohort === "eligible"
        ? "The 35% pilot threshold is met. Read the interviews before deciding how widely to expand."
        : "This denominator includes accounts that could never publish during the pilot. Read " +
          labClaim("COHORT-02", d.source) +
          " and rerun.") +
      "</p>"
    );
  if (id === "agent")
    return (
      '<div class="lab-verdict"><span>Replay outcome</span><strong>' +
      run.status +
      "</strong></div>" +
      trace(run) +
      (run.status === "Valid brief" ? "<p>" + run.brief + "</p>" : "") +
      '<p class="lab-note">Verified cases with repaired rules · complete ' +
      (d.validSeen ? "✓" : "pending") +
      " / missing " +
      (d.pauseSeen ? "✓" : "pending") +
      "</p>"
    );
  return (
    metrics(run) +
    "<p>" +
    (run.includeReceipt
      ? "The receipt mirrors the outcome. This score depends on information unavailable at invitation time."
      : "Without the receipt, the tree gets " +
        run.correct +
        " of " +
        run.total +
        " right. The majority baseline gets " +
        run.baselineCorrect +
        ". " +
        (run.correct <= run.baselineCorrect
          ? "The cleaned tree has yet to beat the simple baseline on these teams."
          : "This tree beats the baseline on this split. Try another cohort before using it.")) +
    "</p>" +
    (d.leakScore != null && d.cleanScore != null
      ? "<p><b>Matched comparison.</b> With receipt " +
        d.leakScore +
        "% · without receipt " +
        d.cleanScore +
        "%, on the same 40 teams.</p>"
      : "")
  );
}
export function gradeLab(id, d) {
  let checks;
  if (id === "launch") {
    const refs = new Set(
      (d.refs || "")
        .toUpperCase()
        .split(/[^A-Z0-9-]+/)
        .filter(Boolean),
    );
    checks = [
      ["Recomputed the eligible cohort", d.output?.cohort === "eligible"],
      [
        "Cited the access policy and an interview using verified IDs",
        refs.has("COHORT-02") &&
          launchSources.slice(2).some((s) => refs.has(s.id)) &&
          [...refs].every((id) => launchSources.some((s) => s.id === id)),
      ],
    ];
  } else if (id === "agent") {
    checks = [
      ["Produced a valid current brief with a completion gate", !!d.validSeen],
      ["Paused for missing evidence", !!d.pauseSeen],
      [
        "Kept the verified source and review rules",
        d.output?.selection === "latest" && d.output?.review === "guard",
      ],
      [
        "Selected a fixed workflow for the stable task",
        d.architecture === "fixed",
      ],
    ];
  } else {
    checks = [
      ["Trained with the receipt field", d.leakScore != null],
      ["Retrained without the leaking field", d.cleanScore != null],
      [
        "Selected the evaluation available at invitation time",
        d.interpret === "clean",
      ],
    ];
  }
  return {
    checks,
    score: Math.round(
      (checks.filter((c) => c[1]).length / checks.length) * 100,
    ),
    passed: checks.every((c) => c[1]),
  };
}
/** Render a complete guest lab in an existing route outlet. */
export function renderLab(id, root, api) {
  const def = labDefs[id],
    esc = api.esc;
  if (!def) throw new Error("Unknown lab.");
  let d = { ...api.draft() },
    busy = false;
  const mobile = window.matchMedia("(max-width: 700px)");
  const put = (patch) => {
    d = { ...d, ...patch };
    api.save(d);
  };
  const $ = (sel) => root.querySelector(sel);
  const all = (sel) => [...root.querySelectorAll(sel)];
  const currentSource = () =>
    def.sources.find((s) => s.id === d.source) || def.sources[0];
  const panelNames = ["Evidence", "Work", "Results"];
  const selectedPanel = () => (panelNames.includes(d.panel) ? d.panel : "Work");
  function setPanel(name, focus = false, persist = true) {
    if (persist) put({ panel: name });
    for (const tab of all("[role=tab]")) {
      const active = tab.dataset.tab === name;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus && mobile.matches) tab.focus();
    }
    for (const panel of all("[data-panel]")) {
      panel.hidden = mobile.matches && panel.dataset.panel !== name;
      panel.setAttribute("role", mobile.matches ? "tabpanel" : "region");
      panel.setAttribute(
        "aria-labelledby",
        mobile.matches
          ? "lab-tab-" + panel.dataset.panel
          : "lab-heading-" + panel.dataset.panel,
      );
    }
  }
  function showError(message, target) {
    const targetPanel = target?.closest("[data-panel]")?.dataset.panel;
    if (targetPanel && mobile.matches) setPanel(targetPanel);
    $("#lab-error").textContent = message;
    if (target) {
      target.setAttribute("aria-invalid", "true");
      target.setAttribute("aria-describedby", "lab-error");
    }
    target?.focus();
  }
  function paintEvidence() {
    const src = currentSource();
    $("#lab-source-list").innerHTML = def.sources
      .map(
        (s) =>
          '<button type="button" data-source="' +
          s.id +
          '" aria-pressed="' +
          (s.id === src.id) +
          '"><code>' +
          s.id +
          "</code><span>" +
          s.title +
          "</span></button>",
      )
      .join("");
    $("#lab-excerpt").innerHTML =
      '<div class="lab-source-meta">' +
      src.id +
      " · " +
      src.date +
      "</div><h3>" +
      src.title +
      "</h3><p>" +
      src.body +
      "</p>" +
      (id === "launch" ? button("cite-source", "Cite in recommendation") : "");
    for (const btn of all("[data-cite]"))
      btn.setAttribute("aria-pressed", String(btn.dataset.cite === src.id));
  }
  function showSource(source, fromWork) {
    put({ source });
    paintEvidence();
    if (fromWork) {
      setPanel("Evidence");
      $("#lab-excerpt").focus();
    } else {
      $('[data-source="' + source + '"]')?.focus();
    }
  }
  function assessment() {
    const checked = d.assessment;
    if (!checked) return "";
    return (
      '<section class="lab-assessment" tabindex="-1"><h3>' +
      (checked.passed
        ? "Objective checks passed"
        : "Revisit the unchecked evidence") +
      "</h3><ul>" +
      checked.checks
        .map(
          ([label, ok]) =>
            "<li>" + (ok ? "✓ Met · " : "○ Revisit · ") + label + "</li>",
        )
        .join("") +
      "</ul><p>" +
      (id === "launch" ? "Decision quality uses your self-review. " : "") +
      'This attempt and its artifact are saved in your portfolio.</p><div class="lab-links"><a href="#/portfolio">View portfolio</a><a href="' +
      def.next +
      '">' +
      def.nextTitle +
      '</a><a href="#/plans">Explore future projects</a></div></section>'
    );
  }
  function paintResult(focus = false) {
    const result = $('[data-panel="Results"]');
    const prediction = def.options[Number(d.prediction) - 1];
    const comparison =
      d.output && prediction
        ? '<p class="lab-prediction"><b>Your prediction</b> ' +
          esc(prediction) +
          "</p>"
        : "";
    result.innerHTML =
      '<h2 id="lab-heading-Results" tabindex="-1">Results</h2><div class="lab-result-body">' +
      comparison +
      labResults(id, d) +
      "</div>" +
      (d.output && d.output.status !== "Failed" && !d.assessment
        ? button("finish", "Save " + labTitles[id].toLowerCase(), "primary")
        : "") +
      assessment();
    if (focus) {
      setPanel("Results");
      (
        result.querySelector(".lab-assessment") || result.querySelector("h2")
      ).focus();
    }
  }
  function paint() {
    const pred = select(
      "prediction",
      [
        ["", "Make a prediction"],
        ...def.options.map((v, i) => [String(i + 1), v]),
      ],
      d.prediction || "",
    );
    root.innerHTML =
      '<article class="lab-wrap"><div class="lab-intro"><a href="#/practice">Practice</a><span> / ' +
      def.path +
      '</span><p class="lab-kicker">Signature lab</p><h1>' +
      def.title +
      '</h1><p class="lab-lede">' +
      def.intro +
      '</p></div><div class="lab-tabs" role="tablist" aria-label="Lab workspace">' +
      panelNames
        .map(
          (n) =>
            '<button type="button" role="tab" id="lab-tab-' +
            n +
            '" aria-controls="lab-panel-' +
            n +
            '" data-tab="' +
            n +
            '">' +
            n +
            "</button>",
        )
        .join("") +
      '</div><div class="lab-grid"><section data-panel="Evidence" id="lab-panel-Evidence" class="lab-evidence"><h2 id="lab-heading-Evidence">Evidence pack</h2><div id="lab-excerpt" tabindex="-1"></div><div id="lab-source-list"></div>' +
      (id === "launch" ? button("csv", "Download pilot CSV") : "") +
      '</section><div class="lab-divider" role="separator" tabindex="0" aria-label="Resize evidence and work panes" aria-orientation="vertical" aria-valuemin="22" aria-valuemax="48" aria-valuenow="' +
      (d.width || 31) +
      '"></div><div class="lab-main"><section data-panel="Work" id="lab-panel-Work"><h2 id="lab-heading-Work">Make a prediction</h2>' +
      field("prediction", def.prediction, pred) +
      "<hr>" +
      (id === "launch"
        ? launchWork(d, esc)
        : id === "agent"
          ? agentWork(d)
          : modelWork(d)) +
      '<details class="lab-detail" data-hint><summary>Need a hint?</summary><p>' +
      def.hint +
      '</p></details><p class="lab-saved">' +
      (Object.keys(d).length
        ? "Draft saved on this device."
        : "Changes save on this device.") +
      '</p></section><section id="lab-panel-Results" data-panel="Results"></section></div></div><p id="lab-error" role="alert"></p></article>';
    $(".lab-grid").style.setProperty("--rail-width", (d.width || 31) + "%");
    paintEvidence();
    paintResult();
    setPanel(selectedPanel(), false, false);
    $("[data-hint]").addEventListener("toggle", (e) => {
      if (e.target.open) put({ hinted: true });
    });
    bindDivider();
  }
  function bindDivider() {
    const bar = $(".lab-divider"),
      grid = $(".lab-grid");
    const resize = (val, persist) => {
      const width = Math.round(Math.min(48, Math.max(22, val)));
      grid.style.setProperty("--rail-width", width + "%");
      bar.setAttribute("aria-valuenow", String(width));
      if (persist) put({ width });
    };
    bar.onkeydown = (e) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      resize(
        e.key === "Home"
          ? 22
          : e.key === "End"
            ? 48
            : Number(bar.getAttribute("aria-valuenow")) +
              (e.key === "ArrowRight" ? 2 : -2),
        true,
      );
    };
    bar.onpointerdown = (e) => {
      bar.setPointerCapture(e.pointerId);
      bar.classList.add("dragging");
    };
    bar.onpointermove = (e) => {
      if (bar.hasPointerCapture(e.pointerId))
        resize(
          ((e.clientX - grid.getBoundingClientRect().left) / grid.clientWidth) *
            100,
          false,
        );
    };
    bar.onlostpointercapture = () => {
      bar.classList.remove("dragging");
      resize(Number(bar.getAttribute("aria-valuenow")), true);
    };
  }
  function recordField(el) {
    const name = el.dataset.field;
    if (!name) return;
    const patch = {
      [name]: el.type === "checkbox" ? el.checked : el.value,
      assessment: null,
    };
    if (["cohort", "pack", "selection", "review", "receipt"].includes(name))
      patch.output = null;
    put(patch);
    $("#lab-error").textContent = "";
    for (const invalid of all("[aria-invalid]")) {
      invalid.removeAttribute("aria-invalid");
      invalid.removeAttribute("aria-describedby");
    }
    $(".lab-saved").textContent = "Draft saved on this device.";
    if (name !== "memo" && name !== "refs") paintResult();
    else if ($(".lab-assessment")) paintResult();
  }
  function saveAssessment() {
    if (!d.output || d.output.status === "Failed") return;
    if (
      id === "launch" &&
      (!d.decision || !d.memo?.trim() || !d.refs?.trim() || !d.self)
    ) {
      const name = !d.decision
        ? "decision"
        : !d.memo?.trim()
          ? "memo"
          : !d.refs?.trim()
            ? "refs"
            : "self";
      showError(
        "Complete the decision, recommendation, citations and self-review before saving.",
        $('[data-field="' + name + '"]'),
      );
      return;
    }
    const grade = gradeLab(id, d);
    const artifact =
      id === "launch"
        ? {
            decision: d.decision,
            recommendation: d.memo,
            references: d.refs,
            chart: d.output,
            sourcePack: launchSources.filter((src) =>
              new Set(d.refs.toUpperCase().split(/[^A-Z0-9-]+/)).has(src.id),
            ),
          }
        : id === "agent"
          ? {
              architecture: d.architecture || "Unspecified",
              run: d.output,
              history: d.history || [],
            }
          : {
              interpretation: d.interpret || "Unspecified",
              result: d.output,
              withReceipt: d.leakScore,
              withoutReceipt: d.cleanScore,
            };
    const rubric = {
      objective: grade.checks.map(([criterion, met]) => ({ criterion, met })),
      selfReview:
        id === "launch"
          ? {
              submitted: !!d.self,
              criterion:
                "Weighed qualitative evidence, uncertainty and a revision condition.",
            }
          : null,
    };
    api.finish({
      title: def.title,
      score: grade.score,
      passed: grade.passed,
      hinted: !!d.hinted,
      artifact: {
        prediction: def.options[Number(d.prediction) - 1],
        ...artifact,
      },
      rubric,
      reason: grade.checks
        .filter((c) => !c[1])
        .map((c) => c[0])
        .join(". "),
    });
    put({ assessment: grade });
    paintResult(true);
  }
  async function execute() {
    if (!d.prediction) {
      showError(
        "Make a prediction before running your experiment.",
        $("[data-field=prediction]"),
      );
      return;
    }
    if (busy) return;
    const outlet = $(".lab-wrap");
    busy = true;
    const btn = $("[data-action=run]");
    btn.disabled = true;
    const labels = {
      launch: "Recomputing…",
      agent: "Replaying…",
      model: "Training…",
    };
    btn.textContent = labels[id];
    $("[data-panel=Work]").setAttribute("aria-busy", "true");
    for (const item of all("[data-field]")) item.disabled = true;
    await new Promise((r) => setTimeout(r, 200));
    if (!outlet.isConnected) return;
    try {
      let patch;
      if (id === "launch") {
        const cohort = d.cohort || "rows";
        patch = { output: { ...activation(accounts(), cohort), cohort } };
      } else if (id === "agent") {
        const run = replay({
          pack: d.pack || "missing",
          selection: d.selection || "first",
          review: d.review || "none",
        });
        patch = {
          output: run,
          validSeen:
            d.validSeen ||
            (run.status === "Valid brief" && run.review === "guard"),
          pauseSeen:
            d.pauseSeen ||
            (run.status === "Paused for review" &&
              run.pack === "missing" &&
              run.selection === "latest"),
          history: [...(d.history || []), run].slice(-8),
        };
      } else {
        const run = trainModel(d.receipt !== false);
        patch = {
          output: run,
          [run.includeReceipt ? "leakScore" : "cleanScore"]: Number(
            ((100 * run.correct) / run.total).toFixed(1),
          ),
        };
      }
      put({ ...patch, assessment: null });
      paintResult(true);
    } catch {
      showError(
        "The run could not finish. Your inputs are saved. Try the experiment again.",
        btn,
      );
    } finally {
      busy = false;
      btn.disabled = false;
      btn.textContent = {
        launch: "Recompute rate",
        agent: "Run replay",
        model: "Train and evaluate",
      }[id];
      $("[data-panel=Work]").removeAttribute("aria-busy");
      for (const item of all("[data-field]")) item.disabled = false;
    }
  }
  paint();
  // Scope listeners to this instance so route navigation cleans up the workspace.
  const instance = $(".lab-wrap");
  const checkSize = () => {
    if (instance.isConnected) setPanel(selectedPanel(), false, false);
    else mobile.removeEventListener("change", checkSize);
  };
  mobile.addEventListener("change", checkSize);
  instance.oninput = (e) => {
    if (e.target.matches("textarea,input:not([type=checkbox])"))
      recordField(e.target);
  };
  instance.onchange = (e) => {
    if (e.target.matches("select,input[type=checkbox]")) recordField(e.target);
  };
  instance.onkeydown = (e) => {
    const tab = e.target.closest("[data-tab]");
    if (!tab || !["Home", "End", "ArrowLeft", "ArrowRight"].includes(e.key))
      return;
    e.preventDefault();
    const idx = panelNames.indexOf(tab.dataset.tab);
    setPanel(
      panelNames[
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? 2
            : (idx + (e.key === "ArrowRight" ? 1 : 2)) % 3
      ],
      true,
    );
  };
  instance.onclick = (e) => {
    const el = e.target.closest("button");
    if (!el) return;
    if (el.dataset.tab) {
      setPanel(el.dataset.tab, true);
      return;
    }
    if (el.dataset.cite || el.dataset.source) {
      showSource(el.dataset.cite || el.dataset.source, !!el.dataset.cite);
      return;
    }
    if (el.dataset.action === "cite-source") {
      const refs = new Set(
        (d.refs || "")
          .split(/[,;\s]+/)
          .map((v) => v.trim().toUpperCase())
          .filter(Boolean),
      );
      refs.add(currentSource().id);
      put({ refs: [...refs].join(", "), assessment: null });
      const input = $("[data-field=refs]");
      input.value = d.refs;
      setPanel("Work");
      input.focus();
      paintResult();
    }
    if (el.dataset.action === "run") execute();
    if (el.dataset.action === "finish") saveAssessment();
    if (el.dataset.action === "csv") {
      const rows = accounts(),
        body = [
          "account_id,eligible,activated,team",
          ...rows.map((r) => [r.id, r.eligible, r.activated, r.team].join(",")),
        ].join("\r\n");
      const url = URL.createObjectURL(new Blob([body], { type: "text/csv" })),
        a = document.createElement("a");
      a.href = url;
      a.download = "foldline-pilot-accounts.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };
}
