// @ts-check
/** @typedef {{label:string, reason:string}} Option */
/** @typedef {{id:string,title:string,body:string}} Source */
/** @typedef {{context:string, sources:Source[], prompt:string, options?:Option[], correct?:number, hint:string, worked:string, number?:{label:string,value:number,unit:string}, writing?:{label:string,example:string}, mapping?:{current:string,history:string}}} Case */
/** @typedef {{id:string,title:string,path:string,skill:string,cases:Case[]}} Lesson */
const opt = (label, reason) => ({ label, reason });
const src = (id, title, body) => ({ id, title, body });
/** @type {Lesson[]} */
export const lessons = [
  {
    id: "d1",
    title: "Spot the unsupported claim",
    path: "use",
    skill: "Claim verification",
    cases: [
      {
        context:
          "A teammate used AI to summarize an onboarding pilot. You have one minute before the brief goes to leadership.",
        sources: [
          src(
            "PILOT-01",
            "Onboarding pilot · 14 May",
            "In April, 18 of 60 invited teams activated. In May, 30 of 60 activated. May also included a new welcome email. No teams were randomly assigned.",
          ),
        ],
        prompt: "Which sentence needs more evidence?",
        options: [
          opt(
            "Activation rose from 30% to 50%.",
            "Both rates follow directly from the counts. Dividing 18 and 30 by 60 gives 30% and 50%.",
          ),
          opt(
            "The new welcome email drove the increase.",
            "The email and higher activation appeared together. The comparison cannot isolate the effect of the email.",
          ),
          opt(
            "Twelve more teams activated in May.",
            "Subtracting 18 from 30 gives twelve. The source supports this count.",
          ),
        ],
        correct: 1,
        hint: "Separate the observed change from the explanation for it.",
        worked:
          "Write “activation rose after the email launched.” To test whether the email caused the increase, randomly assign comparable teams to the new and existing messages.",
      },
      {
        context:
          "A school is drafting a memo about a new study coach. Check the draft against the evaluation note.",
        sources: [
          src(
            "MEMO-02",
            "Study coach trial · 21 March",
            "Students opted in to the coach. Their final quiz average was 84. Students who did not opt in averaged 76. Prior grades were unavailable.",
          ),
        ],
        prompt: "Which sentence should the editor challenge?",
        options: [
          opt(
            "Using the coach improved grades by eight points.",
            "Volunteers may already differ from other students. These averages cannot establish causation.",
          ),
          opt(
            "Coach volunteers averaged 84 on the final quiz.",
            "The reported average is in the evaluation note.",
          ),
          opt(
            "The two groups had different final averages.",
            "The observed means are 84 and 76.",
          ),
        ],
        correct: 0,
        hint: "Look for a sentence that turns a difference into a cause.",
        worked:
          "Describe the eight-point difference and the self-selection. A randomized offer with comparable assessment conditions could test the causal claim.",
      },
    ],
  },
];

const paths = {
  use: "Use AI well",
  build: "Build with AI",
  understand: "Understand models",
};
const nextLab = {
  use: ["launch", "Make a launch decision"],
  build: ["agent", "Repair a research assistant"],
  understand: ["model", "Investigate a suspicious classifier"],
};
const stopTrace = (variant, choice) => {
  if (variant === 1) {
    const events = ["Read receipt", "Calculate refund $180"];
    if (choice === 0)
      events.push("Gate compares $180 with $100", "Pause · approval required");
    if (choice === 1)
      events.push(
        "Attempt split transfer",
        "Violation · total exceeds authorized amount",
      );
    if (choice === 2)
      events.push(
        "Transfer executed",
        "Late approval request · funds already moved",
      );
    return events;
  }
  const events = [
    "Read FILE-1 · source missing",
    "Read FILE-2 · source missing",
  ];
  if (choice === 0)
    events.push(
      "Repeat FILE-2 · source missing",
      "Harness time limit · unsuccessful run",
    );
  if (choice === 1)
    events.push("Publish guessed value", "Unsupported completion");
  if (choice === 2)
    events.push(
      "Unique file pack exhausted",
      "Pause · required source missing",
    );
  return events;
};
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
const asNumber = (s) => (String(s ?? "").trim() === "" ? NaN : Number(s));

/** Grade only structured responses. Free prose is preserved for self-review. */
export function gradeDrill(c, answer) {
  const checks = [];
  if (c.options)
    checks.push({
      label: "Decision",
      pass: answer.choice === c.correct,
      detail: c.options[answer.choice]?.reason || "Choose a response first.",
    });
  if (c.mapping) {
    const current = answer.current === c.mapping.current,
      history = answer.history === c.mapping.history;
    checks.push({
      label: "Current source",
      pass: current,
      detail: current
        ? "This approved document supports the current claim."
        : `Inspect ${c.mapping.current}. Its approved scope and effective date establish the current claim.`,
    });
    checks.push({
      label: "Earlier authority",
      pass: history,
      detail: history
        ? "The source map keeps the earlier rule available for context."
        : `Use ${c.mapping.history} to document the earlier authoritative rule. A discussion or prototype cannot establish it.`,
    });
  }
  if (c.number) {
    const pass = Math.abs(asNumber(answer.amount) - c.number.value) < 0.01;
    checks.push({
      label: "Calculation",
      pass,
      detail: pass
        ? "Your calculation agrees with the source counts."
        : `The evidence gives ${c.number.value}${c.number.unit}. ${c.worked}`,
    });
  }
  const passed = checks.every((row) => row.pass);
  return {
    checks,
    passed,
    score: Math.round(
      (checks.filter((row) => row.pass).length / Math.max(1, checks.length)) *
        100,
    ),
  };
}
function sourceCards(sources) {
  return sources
    .map(
      (s) =>
        `<article class="ld-source" id="ev-${s.id}"><span class="ld-code">${esc(s.id)}</span><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></article>`,
    )
    .join("");
}
function optionsHtml(c, a) {
  return (
    c.options
      ?.map(
        (o, i) =>
          `<label class="ld-option"><input type="radio" name="choice" value="${i}" ${a.choice === i ? "checked" : ""} required><span>${esc(o.label)}</span></label>`,
      )
      .join("") || ""
  );
}

function sourceMapping(c, state) {
  if (!c.mapping) return "";
  return [
    ["current", "Source supporting the current claim"],
    ["history", "Earlier rule or agreement"],
  ]
    .map(
      ([key, label]) =>
        `<label class="ld-field">${label}<select name="${key}" required><option value="">Choose a source</option>${c.sources.map((s) => `<option value="${s.id}" ${state[key] === s.id ? "selected" : ""}>${s.id} · ${esc(s.title)}</option>`).join("")}</select></label>`,
    )
    .join("");
}
function slideChart(variant, choice) {
  let title, unit, rows;
  if (variant === 0) {
    if (choice === 1)
      return '<p class="ld-hint">Preview unavailable. This export counts tickets. To chart the share of users, you also need user counts.</p>';
    const open = choice === 2;
    title = open ? "Open tickets today" : "Total ticket arrivals";
    unit = "tickets";
    rows = open
      ? [
          ["Setup", 30],
          ["Billing", 4],
          ["Export", 2],
        ]
      : [
          ["Setup", 60],
          ["Billing", 40],
          ["Export", 10],
        ];
  } else {
    const rate = choice === 0;
    title = rate
      ? "Coverage among eligible students"
      : choice === 2
        ? "Students served, both schools"
        : "Students served";
    unit = rate ? "%" : "students";
    rows = rate
      ? [
          ["North", 60],
          ["South", 40],
        ]
      : choice === 2
        ? [["Combined", 70]]
        : [
            ["North", 30],
            ["South", 40],
          ];
  }
  const max = unit === "%" ? 100 : Math.max(...rows.map((r) => Number(r[1])));
  return `<figure class="ld-chart"><figcaption>${title}</figcaption>${rows.map(([label, n]) => `<div class="ld-bar"><span>${label}</span><i aria-hidden="true" style="width:${(100 * Number(n)) / max}%"></i><b>${n}${unit === "%" ? "%" : ""}</b></div>`).join("")}<small>Scale · 0 to ${max} ${unit}</small></figure>`;
}

export function renderLesson(id, root, api) {
  const lesson = lessons.find((l) => l.id === id);
  if (!lesson) return;
  if (id === "capstone") {
    renderCapstone(root, api);
    return;
  }
  let state = { variant: 0, seen: [], ...api.draft() };
  const c = () => lesson.cases[state.variant] || lesson.cases[0];
  const save = () => api.save({ ...state });
  function draw(focus) {
    const data = c(),
      feedback = state.result;
    const num = Number(id.slice(1));
    root.innerHTML = `<div class="ld-wrap"><div class="ld-top"><a href="#/practice">Practice</a><span>/</span><span>${paths[lesson.path]}</span></div><div class="ld-progress"><span>Drill ${String(num).padStart(2, "0")} of 12</span><span>${state.variant ? "Transfer case" : "Practice case"}</span></div><div class="ld-track"><span style="width:${(num / 12) * 100}%"></span></div><h1>${esc(lesson.title)}</h1><p class="ld-intro">${esc(data.context)}</p><section aria-label="Case evidence">${sourceCards(data.sources)}</section><form class="ld-form"><fieldset ${feedback ? "disabled" : ""}><legend>${esc(data.prompt)}</legend>${optionsHtml(data, state)}${sourceMapping(data, state)}${id === "d5" ? '<div data-chart aria-live="polite">' + slideChart(state.variant, state.choice) + "</div>" : ""}${data.number ? `<label class="ld-field">${esc(data.number.label)}<input name="amount" type="number" required step="any" value="${esc(state.amount || "")}"></label>` : ""}${data.writing ? `<label class="ld-field">${esc(data.writing.label)}<textarea name="writing" required minlength="12" rows="3">${esc(state.writing || "")}</textarea></label>` : ""}</fieldset>${feedback ? "" : `<div class="ld-actions"><button class="ld-primary" type="submit">${id === "d10" ? "Rerun trace" : "Check my work"}</button><button class="ld-link" type="button" data-hint aria-expanded="${!!state.hintOpen}">${state.hintOpen ? "Hide hint" : "Show a hint"}</button></div>`}</form>${!feedback ? '<p class="ld-saved" data-draft-status>Responses save on this device.</p>' : ""}${state.hintOpen && !feedback ? `<p class="ld-hint">${esc(data.hint)}</p>` : ""}
 ${
   feedback
     ? `<section tabindex="-1" class="ld-feedback ${feedback.passed ? "is-pass" : "is-retry"}" aria-label="Feedback"><span class="ld-code">${feedback.passed ? "✓ Correct" : "↺ Review your work"}</span><h2>${feedback.passed ? "Your evidence checks out." : "Take another look."}</h2>${feedback.checks.map((v) => `<p><strong>${esc(v.label)}.</strong> ${esc(v.detail)}</p>`).join("")}${
         id === "d10"
           ? "<h3>Replay result</h3><ol>" +
             stopTrace(state.variant, state.choice)
               .map((event) => "<li>" + esc(event) + "</li>")
               .join("") +
             "</ol>"
           : ""
       }<details><summary>Worked explanation</summary><p>${esc(data.worked)}</p>${data.writing ? `<p><strong>Compare your draft.</strong> ${esc(data.writing.example)} Your writing is saved for self-review.</p>` : ""}</details><p class="ld-saved">Saved to your portfolio · ${esc(lesson.skill)} · ${feedback.score}% on objective checks</p><div class="ld-actions">${feedback.passed ? `<a class="ld-primary" href="${api.nextRoute?.() || (num === 12 ? "#/lesson/capstone" : "#/lesson/d" + (num + 1))}">Next challenge</a><button type="button" class="ld-link" data-retry>Practice again</button>` : `<button type="button" class="ld-primary" data-retry>Retry this case</button>`}<button type="button" class="ld-link" data-variation>${state.variant ? "Revisit practice case" : "Try a transfer case"}</button><a href="#/portfolio">Portfolio</a></div><p class="ld-project">Next project · <a href="#/lab/${nextLab[lesson.path][0]}">${nextLab[lesson.path][1]}</a></p></section>`
     : ""
 }</div>`;
    root.querySelector("[data-hint]")?.addEventListener("click", () => {
      state.hinted = true;
      state.hintOpen = !state.hintOpen;
      save();
      draw("[data-hint]");
    });
    const form = root.querySelector("form");
    form.oninput = (e) => {
      const el = e.target;
      if (el.name === "choice") state.choice = Number(el.value);
      else state[el.name] = el.value;
      save();
      if (id === "d5" && el.name === "choice")
        root.querySelector("[data-chart]").innerHTML = slideChart(
          state.variant,
          state.choice,
        );
      const status = root.querySelector("[data-draft-status]");
      if (status)
        status.textContent = "Draft saved · current response on this device.";
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      if (state.result) return;
      state.result = gradeDrill(data, state);
      const fresh =
        state.variant === 1 &&
        !state.hinted &&
        !state.seen.includes(state.variant);
      state.seen = [...new Set([...state.seen, state.variant])];
      save();
      api.finish({
        title: lesson.title,
        score: state.result.score,
        passed: state.result.passed,
        hinted: !!state.hinted,
        fresh,
        artifact: {
          case: state.variant ? "Transfer" : "Practice",
          sources: data.sources.map((s) => s.id),
          sourcePack: data.sources,
          ...(data.mapping
            ? { currentSource: state.current, earlierSource: state.history }
            : {}),
          ...(id === "d10"
            ? { trace: stopTrace(state.variant, state.choice) }
            : {}),
          decision: data.options?.[state.choice]?.label || "",
          calculation: state.amount || "",
          draft: state.writing || "",
          explanation: data.worked,
        },
        rubric: state.result.checks,
      });
      draw(".ld-feedback");
    };
    root.querySelector("[data-retry]")?.addEventListener("click", () => {
      delete state.result;
      save();
      draw("legend");
    });
    root.querySelector("[data-variation]")?.addEventListener("click", () => {
      state = { variant: 1 - state.variant, seen: state.seen };
      save();
      draw("h1");
    });
    if (focus) {
      const target = root.querySelector(focus);
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus();
        if (focus === "[data-hint]") target.removeAttribute("tabindex");
      }
    }
  }
  draw();
}

/** @param {string} id @param {string} title @param {string} path @param {string} skill @param {Case[]} cases */
function addLesson(id, title, path, skill, cases) {
  lessons.push({ id, title, path, skill, cases });
}
/** A structured decision and, optionally, a saved work product to compare with an exemplar. */
function decision(
  context,
  sources,
  prompt,
  choices,
  correct,
  hint,
  worked,
  writing,
) {
  return {
    context,
    sources,
    prompt,
    options: choices.map(([label, reason]) => opt(label, reason)),
    correct,
    hint,
    worked,
    writing,
  };
}
addLesson(
  "d2",
  "Give a brief a finish line",
  "use",
  "Observable success conditions",
  [
    decision(
      "The support lead wants a useful first draft by noon.",
      [
        src(
          "BRIEF-04",
          "Support handoff",
          "“Tell me what customers think.” The team has twelve anonymized tickets and can fix one onboarding issue this sprint.",
        ),
      ],
      "Choose the check your request should specify.",
      [
        [
          "Make the analysis insightful.",
          "“Insightful” means different things to different reviewers. Supply a count and something the reader can verify.",
        ],
        [
          "Name one recurring blocker, count affected tickets, and cite their IDs.",
          "A reviewer can check the blocker against the cited tickets and recompute its frequency.",
        ],
        [
          "Use at least five paragraphs.",
          "A paragraph count measures length. It says little about which blocker the team should fix.",
        ],
      ],
      1,
      "Imagine someone accepting or rejecting the finished draft. What can they inspect?",
      "Specify the input, the decision, and an acceptance check. State how missing evidence should be handled.",
      {
        label: "Rewrite the lead’s request in one or two sentences.",
        example:
          "Using these twelve tickets, recommend one onboarding fix. Cite the affected ticket IDs and report the count. Flag ambiguous reports separately.",
      },
    ),
    decision(
      "A museum editor asks an assistant to “improve the guide.”",
      [
        src(
          "GUIDE-07",
          "Visitor guide brief",
          "First-time visitors have 45 minutes, need step-free access, and want to see three works. The approved map lists lift locations.",
        ),
      ],
      "Choose a check for the revised request.",
      [
        [
          "Use a friendlier voice.",
          "Tone alone cannot establish that visitors can follow the route.",
        ],
        [
          "Mention every room.",
          "Listing all rooms would work against the time limit.",
        ],
        [
          "List three works on a step-free route totaling at most 45 minutes, with map references.",
          "A colleague can trace this route and verify its time and accessibility.",
        ],
      ],
      2,
      "What could a colleague check on the map?",
      "Define a verifiable route, time budget, and evidence source.",
      {
        label: "Write the request the editor can reuse.",
        example:
          "Use the approved map to lay out a 45-minute step-free visit to three works. Cite the lift and room for each stop, and show the travel-time total.",
      },
    ),
  ],
);
addLesson("d3", "Trace a claim to its source", "use", "Dated source judgment", [
  decision(
    "As of 8 June, a generated FAQ says trial customers can export reports.",
    [
      src(
        "POL-1",
        "Signed policy · effective 1 May",
        "Trial accounts can view reports. Exports require a paid account.",
      ),
      src(
        "IDEA-9",
        "Planning note · 7 June",
        "Proposal for next quarter: allow trial exports. Approval pending.",
      ),
    ],
    "What should the FAQ say today?",
    [
      [
        "Trial exports are available, citing IDEA-9.",
        "The June document records a proposal. Its date cannot give it policy authority.",
      ],
      [
        "Report export requires a paid account, citing POL-1.",
        "The signed, effective policy addresses the exact feature and account type.",
      ],
      [
        "Trial users cannot view reports, citing POL-1.",
        "The policy expressly allows trial users to view them.",
      ],
    ],
    1,
    "Read both the effective date and the status of the document.",
    "Cite POL-1 for the current rule. Keep proposed changes in a separate roadmap note.",
  ),
  decision(
    "A teacher asks whether the lab opens on Saturdays next month.",
    [
      src(
        "CAL-6",
        "Approved summer calendar · 12 May",
        "Beginning 1 July the lab opens on Saturdays, 10–14.",
      ),
      src(
        "NEWS-3",
        "Staff newsletter · 9 May",
        "Saturday hours are being discussed.",
      ),
    ],
    "Which source supports a July announcement?",
    [
      [
        "CAL-6, with the July start and the four-hour window.",
        "The approved calendar makes the schedule and its effective date explicit.",
      ],
      [
        "NEWS-3, because discussion confirms a decision.",
        "Discussion records intent and leaves the outcome open.",
      ],
      [
        "CAL-6, saying Saturdays are already open in June.",
        "That moves the effective date one month early.",
      ],
    ],
    0,
    "Ask when the decision takes effect.",
    "Quote the effective period and hours together so the claim remains bounded.",
  ),
]);
addLesson("d4", "Recompute the activation rate", "use", "Cohort arithmetic", [
  {
    context:
      "A launch dashboard divides activations by every event row. You need the rate among accounts that could activate.",
    sources: [
      src(
        "COHORT-1",
        "Account export · 30 April",
        "200 raw rows represent 198 accounts. Of 80 eligible accounts, 32 activated. Each activation belongs to one eligible account.",
      ),
    ],
    prompt: "Calculate activation among eligible accounts.",
    number: { label: "Eligible activation rate (%)", value: 40, unit: "%" },
    hint: "Use one denominator entry per account that could activate.",
    worked:
      "32 activated ÷ 80 eligible × 100 = 40%. Using 200 event rows gives the dashboard’s misleading 16%.",
  },
  {
    context:
      "A pilot report counts renewal reminders instead of eligible subscribers.",
    sources: [
      src(
        "COHORT-2",
        "Renewal ledger · 31 August",
        "Of 72 subscribers whose renewal windows opened, 54 renewed. The email system sent 120 reminders, including repeats.",
      ),
    ],
    prompt: "Calculate renewal among eligible subscribers.",
    number: { label: "Renewal rate (%)", value: 75, unit: "%" },
    hint: "A subscriber may receive more than one reminder.",
    worked:
      "54 renewed ÷ 72 eligible × 100 = 75%. Reminder volume counts messages.",
  },
]);
addLesson(
  "d5",
  "Revise a chart for its reader",
  "use",
  "Audience-aware revision",
  [
    decision(
      "A product lead must choose where one support specialist should work next week.",
      [
        src(
          "OPS-11",
          "Support queue summary",
          "Setup: 30 of 60 tickets remain open. Billing: 4 of 40 remain open. Export: 2 of 10 remain open.",
        ),
      ],
      "Choose the chart measure that directly addresses the staffing decision.",
      [
        [
          "Total ticket arrivals in each queue.",
          "Arrivals include resolved work. The lead needs the remaining workload.",
        ],
        [
          "Share of all users who contacted support.",
          "The data lacks a user denominator and the decision concerns open work.",
        ],
        [
          "Open ticket counts by queue, measured today.",
          "Counts show the workload a specialist can address. Setup has thirty open tickets.",
        ],
      ],
      2,
      "Which measure corresponds to the work a specialist can pick up?",
      "Use horizontal bars for 30, 4, and 2 open tickets. Include time and units. Confirm ticket effort before assigning the specialist.",
      {
        label: "Write the new slide title and explain one change.",
        example:
          "“Setup holds 30 of today’s 36 open tickets.” I replaced arrival counts with open workload so the lead can decide where to assign help.",
      },
    ),
    decision(
      "A school principal compares tutoring coverage across two schools of different sizes.",
      [
        src(
          "TUT-02",
          "Tutoring register",
          "North: 30 of 50 eligible students received tutoring. South: 40 of 100 eligible students received tutoring.",
        ),
      ],
      "Choose the axis for a fair coverage comparison.",
      [
        [
          "Eligible students served (%)",
          "Within-school rates normalize the size difference. North reaches 60% and South reaches 40%.",
        ],
        [
          "Students served (count)",
          "Counts answer a volume question but hide the different eligible populations.",
        ],
        [
          "Total students served across both schools",
          "Combining the two schools hides the coverage difference the principal needs to see.",
        ],
      ],
      0,
      "What proportion of each school’s eligible students received tutoring?",
      "Show North 60% (30/50) and South 40% (40/100). Retain counts for readers planning capacity.",
      {
        label: "Write the revised chart title and explain your measure.",
        example:
          "“Coverage is lower at South despite more students served.” I used within-school rates because the eligible populations differ.",
      },
    ),
  ],
);
addLesson("d6", "Choose the right tool", "use", "Tool selection", [
  decision(
    "The operations team needs an exact total for a reimbursement memo.",
    [
      src(
        "COST-8",
        "Approved line items",
        "Travel $127.43, venue $890.75, printing $63.19. All items are USD and include tax.",
      ),
    ],
    "Which approach fits this request?",
    [
      [
        "Ask for a fluent estimate.",
        "Even a plausible estimate can change the reimbursement amount.",
      ],
      [
        "Use a calculation tool on the approved amounts.",
        "The necessary values are present and the arithmetic has an exact answer.",
      ],
      [
        "Search for more reimbursement examples.",
        "Other examples cannot improve the sum of these approved amounts.",
      ],
    ],
    1,
    "Check whether the uncertainty is about evidence or arithmetic.",
    "127.43 + 890.75 + 63.19 = $1,081.37. Preserve the three inputs alongside the total.",
  ),
  decision(
    "A buyer asks whether a supplier’s coating is safe for contact with hot food.",
    [
      src(
        "SPEC-8",
        "Vendor summary",
        "Lists suitability for cold, dry food. No hot-food temperature range or test report is provided.",
      ),
    ],
    "What is the next useful action?",
    [
      [
        "Give a direct yes based on the cold-food claim.",
        "The intended use lies outside the stated test conditions.",
      ],
      [
        "Calculate a heat tolerance from the product price.",
        "Price supplies no physical basis for that calculation.",
      ],
      [
        "Request the test report for the intended temperature and contact duration.",
        "A use-specific report could address the missing evidence.",
      ],
    ],
    2,
    "Find the condition the available evidence actually covers.",
    "Hold the suitability claim pending a relevant, current test report. State the exact missing condition.",
  ),
]);
addLesson("d7", "Map conflicting sources", "build", "Source mapping", [
  {
    context:
      "Your briefing assistant must resolve a delivery deadline before publishing.",
    sources: [
      src(
        "ORD-17",
        "Signed order · 5 June",
        "The contractual delivery deadline is 30 June.",
      ),
      src(
        "CHAT-2",
        "Sales chat · 12 June",
        "We hope to move delivery to 24 June. Customer approval pending.",
      ),
      src(
        "REV-3",
        "Signed amendment · 14 June",
        "Both parties approve 26 June. Supersedes section 3 of ORD-17.",
      ),
    ],
    prompt: "Map the approved delivery date to its sources.",
    mapping: { current: "REV-3", history: "ORD-17" },
    hint: "Find an explicit supersession and verify authority.",
    worked:
      "The approved deadline is 26 June. Link the claim to REV-3 for the effective date, and REV-3 to ORD-17 for its history. The sales chat remains background.",
  },
  {
    context: "A library assistant is assembling a borrowing guide for 4 June.",
    sources: [
      src(
        "RULE-1",
        "Board minutes · 3 March",
        "Maximum loan duration is 21 days.",
      ),
      src(
        "TEST-4",
        "Prototype mockup · 18 May",
        "A screen draft shows “28 days.”",
      ),
      src(
        "RULE-6",
        "Approved rule · effective 1 June",
        "Adult loans are now 28 days. Children’s loans remain 21 days.",
      ),
    ],
    prompt: "Map the children’s loan rule to its sources.",
    mapping: { current: "RULE-6", history: "RULE-1" },
    hint: "Check the population as well as the date and authority.",
    worked:
      "Children’s loans remain 21 days under RULE-6. Retain RULE-1 as the earlier authority. TEST-4 is a prototype without approved scope.",
  },
]);
addLesson("d8", "Place a check in the run", "build", "Harness verification", [
  decision(
    "A briefing agent cites a superseded price. Its harness is the environment and controls that let it do and verify its work.",
    [
      src(
        "RUN-16",
        "Replay trace",
        "1 Search files → 2 Draft with PRICE-OLD → 3 Publish externally → 4 Archive. The approved pricing register is available as a read-only tool.",
      ),
    ],
    "Where should the harness verify cited prices?",
    [
      [
        "Before search, without inspecting the draft.",
        "The harness does not yet know which price the draft will cite.",
      ],
      [
        "Between drafting and publishing, comparing cited prices with the approved register.",
        "The final claim is available and the harness can still stop publication.",
      ],
      [
        "After archiving the published brief.",
        "This could discover an error only after readers have received it.",
      ],
    ],
    1,
    "Place the check where the claim exists and the consequential action is still reversible.",
    "Bind the gate to the exact draft version. A mismatch pauses publication and records the offending source.",
  ),
  decision(
    "A workflow turns a spreadsheet into invoice drafts.",
    [
      src(
        "RUN-21",
        "Replay trace",
        "1 Read rows → 2 Apply tax rules → 3 Send invoices → 4 Log totals. A test fixture provides the expected total for each invoice.",
      ),
    ],
    "Where should the totals gate run?",
    [
      [
        "After tax calculation and before send.",
        "Computed invoices can be compared with expected totals before any are sent.",
      ],
      [
        "After sending, so the customer can flag an error.",
        "This transfers the verification burden to the customer.",
      ],
      [
        "Before reading rows, assuming the previous run passed.",
        "The previous run cannot verify this batch’s data.",
      ],
    ],
    0,
    "Identify the first point at which the final amount exists.",
    "Use deterministic arithmetic checks before committing the external action. Keep the fixture and trace with the run.",
  ),
]);
addLesson("d9", "Fit the system to the job", "build", "System selection", [
  decision(
    "A finance team repeats the same approved reconciliation every Friday.",
    [
      src(
        "JOB-04",
        "Weekly reconciliation",
        "Load two fixed CSVs, match invoice IDs, compare integer-cent totals, and send mismatches to a reviewer. The columns and rules are known.",
      ),
    ],
    "Choose the simplest verifiable system.",
    [
      [
        "A fresh chat with a new instruction each Friday.",
        "Repeated free-form instructions make a stable process harder to reproduce.",
      ],
      [
        "A fixed workflow with deterministic comparisons and a review queue.",
        "Known inputs and fixed rules support reproducible checks and a clear exception path.",
      ],
      [
        "A tool-using agent that chooses its own next action.",
        "There is no unresolved search strategy here. More autonomy adds avoidable failure modes.",
      ],
    ],
    1,
    "Ask which steps actually depend on unknown intermediate observations.",
    "Keep parsing and matching deterministic. Provide an explicit exception path for unmatched IDs.",
  ),
  decision(
    "A researcher asks a one-off question about the wording of a paragraph already in view.",
    [
      src(
        "JOB-19",
        "Editorial task",
        "The researcher wants three alternative opening sentences and will personally choose one. No tools, external facts, or side effects are needed.",
      ),
    ],
    "Choose the smallest suitable approach.",
    [
      [
        "A direct conversation with the paragraph as context.",
        "The request is bounded and the author makes the final editorial decision.",
      ],
      [
        "A scheduled fixed workflow.",
        "A schedule and persistent state add overhead for a one-off edit.",
      ],
      [
        "A tool-using agent with web access.",
        "Web access does not help revise the supplied language and broadens permissions unnecessarily.",
      ],
    ],
    0,
    "Match autonomy to uncertainty and permissions to the job.",
    "Provide three alternatives, explain the tonal differences, and leave the choice with the author.",
  ),
]);
addLesson("d10", "Repair a stop condition", "build", "Bounded execution", [
  decision(
    "A synthetic briefing agent keeps searching when its required source is absent.",
    [
      src(
        "TRACE-5",
        "Replay · fixed file pack",
        "lookup(first) → MISSING · lookup(second) → MISSING · lookup(second) → MISSING. The permitted pack contains two files.",
      ),
    ],
    "Choose a rule and predict the next state.",
    [
      [
        "Repeat the last lookup until it works → running.",
        "The pack cannot change during this run. Repeating the lookup cannot supply new evidence.",
      ],
      [
        "Publish a plausible value after two misses → complete.",
        "A retry budget does not turn absent evidence into support.",
      ],
      [
        "After both unique files are exhausted, record the missing source → paused for review.",
        "The bounded search is exhausted. The review record preserves the unresolved dependency.",
      ],
    ],
    2,
    "What can another search discover once every permitted file has been checked?",
    "Replay with the new rule: first miss → second miss → pause(required source missing). Resume only after a reviewer supplies evidence.",
  ),
  decision(
    "An agent has prepared a refund that exceeds its authorized amount.",
    [
      src(
        "TRACE-9",
        "Replay · refund proposal",
        "Read receipt → calculate refund $180 → prepare transfer. Tool policy allows automatic refunds up to $100.",
      ),
    ],
    "Choose a gate and predict the next state.",
    [
      [
        "Check total before transfer; above $100 → awaiting human approval.",
        "The proposed total crosses the tool permission boundary. Approval can precede the transfer.",
      ],
      [
        "Make two smaller transfers → complete.",
        "Splitting the transfer evades the intended total limit.",
      ],
      [
        "Transfer, then request approval → awaiting approval.",
        "The consequential action has already occurred.",
      ],
    ],
    0,
    "Check the proposed action as a whole before the tool executes.",
    "Run: calculate $180 → gate(total > $100) → pause. Record the planned amount and the responsible reviewer.",
  ),
]);
addLesson("d11", "Find tomorrow’s data", "understand", "Feature leakage", [
  {
    ...decision(
      "A team predicts late shipments at dispatch. Inspect the feature timestamps before accepting the score.",
      [
        src(
          "FEAT-1",
          "Feature dictionary",
          "Route length: known at dispatch. Carrier: known at dispatch. Late-fee amount: assigned only after delivery.",
        ),
        src(
          "SPLIT-1",
          "Held-out shipment test",
          "Of 100 shipments, 70 arrived on time. The model using all fields got 98 right; the dispatch-only model got 78 right.",
        ),
      ],
      "Which field must be removed for an honest dispatch-time comparison?",
      [
        ["Route length", "Route length is available at the decision time."],
        [
          "Late-fee amount",
          "This field is assigned after the outcome and reveals information the deployed model will lack.",
        ],
        ["Carrier", "The carrier is already known at dispatch."],
      ],
      1,
      "Imagine freezing each row at the moment a prediction is requested.",
      "Predicting “on time” for every held-out shipment scores 70/100 = 70%. The usable model gains eight percentage points over that baseline.",
    ),
    number: {
      label: "Majority-class baseline accuracy (%)",
      value: 70,
      unit: "%",
    },
  },
  {
    ...decision(
      "A triage model predicts whether a ticket will be escalated at intake.",
      [
        src(
          "FEAT-5",
          "Ticket features",
          "Channel and initial text exist when a ticket arrives. Senior-review minutes are logged only after escalation.",
        ),
        src(
          "SPLIT-4",
          "Held-out tickets",
          "48 of 60 tickets stayed in the regular queue. A model using review minutes got 59 right. The intake-only version got 50 right.",
        ),
      ],
      "Remove the feature unavailable at intake.",
      [
        [
          "Initial text",
          "This text is part of the incoming request and available at prediction time.",
        ],
        ["Channel", "The channel is recorded on arrival."],
        [
          "Senior-review minutes",
          "This measurement follows escalation and cannot be known at intake.",
        ],
      ],
      2,
      "Which column is created by the process you want to predict?",
      "Always predicting “regular queue” scores 48/60 = 80%. The feasible model gets 50/60, two additional correct decisions.",
    ),
    number: {
      label: "Majority-class baseline accuracy (%)",
      value: 80,
      unit: "%",
    },
  },
]);
addLesson(
  "d12",
  "Challenge a capability claim",
  "understand",
  "Disconfirming tests",
  [
    decision(
      "A vendor says its model “always understands refund exceptions.”",
      [
        src(
          "CLAIM-3",
          "Evaluation record",
          "The demo uses three examples from the model’s training guide. Standard policy: no refunds after 30 days. Exception: documented delivery damage qualifies through day 60.",
        ),
      ],
      "Choose a test that could expose failure on an unfamiliar case.",
      [
        [
          "Replay all three demo examples and count fluent explanations.",
          "Training-guide repeats and fluency supply little evidence about transfer.",
        ],
        [
          "Use unseen cases matched except for damage documentation. Compare decisions against the policy and a 30-day rule.",
          "This varies the decisive condition and compares policy correctness against a clear baseline.",
        ],
        [
          "Ask the model how confident it is.",
          "Confidence alone cannot establish policy correctness.",
        ],
      ],
      1,
      "Change one decision-relevant fact in a new case and set the answer in advance.",
      "At day 45, the documented-damage case qualifies and its undamaged counterpart does not. A model that treats both alike has failed this test.",
      {
        label: "Write a concrete outcome that would weaken the claim.",
        example:
          "If the model refuses both day-45 cases, it has failed the documented-damage exception despite matching the easy baseline.",
      },
    ),
    decision(
      "A model card claims near-perfect extraction from invoices.",
      [
        src(
          "CLAIM-6",
          "Benchmark notes",
          "All evaluated invoices came from one template. The model must now handle unseen templates with the same fields and mixed currencies.",
        ),
      ],
      "Which test addresses the deployment claim?",
      [
        [
          "Hold out new templates, score exact amount and currency together, and compare with the existing parser.",
          "The test changes the relevant condition and defines both an observable outcome and baseline.",
        ],
        [
          "Shuffle the same templates and score writing style.",
          "Stylistic quality misses the extraction task and template shift.",
        ],
        [
          "Use the training invoices with more decimal places.",
          "This keeps the familiar layout and changes an incidental detail.",
        ],
      ],
      0,
      "What will differ between the benchmark and the first real batch?",
      "Hold out complete template families. Count an extraction as correct only when both amount and currency match the reference.",
      {
        label: "Write a result that would change your deployment decision.",
        example:
          "If the model extracts amounts correctly but loses the currency on new templates more often than our parser, I would hold deployment.",
      },
    ),
  ],
);

const attendanceCase = {
  context:
    "The events team must decide whether to move a workshop into a larger room. Its AI briefing predicts 70 arrivals from 100 registrations. Audit the forecast before the booking deadline.",
  sources: [
    src(
      "EVT-12",
      "Prior workshop · door scans",
      "Of 40 community registrants, 20 attended. Of 40 member registrants, 36 attended. An analyst averaged the two attendance rates.",
    ),
    src(
      "REG-08",
      "Current event · registration snapshot",
      "This event has 80 community registrations and 20 member registrations. The room seats 65. No waitlist is available.",
    ),
    src(
      "OPS-03",
      "Booking note · 9 September",
      "A larger room costs an additional $180. The host can collect a fresh RSVP confirmation before the venue cutoff.",
    ),
  ],
  prompt: "Which approach answers the room question?",
  options: [
    opt(
      "Apply the prior event’s overall attendance rate to everyone.",
      "The prior event had equal group sizes. This event’s mix is 80/20.",
    ),
    opt(
      "Apply each prior group’s attendance rate to the corresponding current group, then add the counts.",
      "The calculation preserves the current registration mix.",
    ),
    opt(
      "Book for all 100 registrations as a point forecast.",
      "Maximum possible attendance is an upper bound. It does not estimate expected attendance.",
    ),
  ],
  correct: 1,
  number: { label: "Expected attendees (people)", value: 58, unit: " people" },
  hint: "",
  worked:
    "Community: 20/40 × 80 = 40. Members: 36/40 × 20 = 18. Together that gives 58 expected attendees, seven below capacity. This assumes each group’s attendance rate carries over.",
};
lessons.push({
  id: "capstone",
  title: "Make the room decision",
  path: "understand",
  skill: "Fresh-case transfer",
  cases: [attendanceCase],
});
const capRubric = [
  "I compared the expected count with room capacity.",
  "I named an assumption that could fail in this event.",
  "I identified new evidence that could change my decision.",
];
export function gradeCapstone(a) {
  const objective = gradeDrill(attendanceCase, a);
  const references = String(a.refs || "")
    .toUpperCase()
    .split(/[^A-Z0-9-]+/)
    .filter(Boolean);
  const pass =
    ["EVT-12", "REG-08"].every((id) => references.includes(id)) &&
    references.every((id) => attendanceCase.sources.some((s) => s.id === id));
  const checks = [
    ...objective.checks,
    {
      label: "Source references",
      pass,
      detail: pass
        ? "You cited the prior scans and current registration snapshot."
        : "Use EVT-12 for observed group rates and REG-08 for the current mix. Copy source IDs exactly.",
    },
  ];
  return {
    checks,
    passed: checks.every((r) => r.pass),
    score: Math.round(
      (100 * checks.filter((r) => r.pass).length) / checks.length,
    ),
  };
}
function renderCapstone(root, api) {
  let state = { submitted: 0, self: [], ...api.draft() };
  function draw(focus) {
    const done = !!state.result;
    root.innerHTML = `<div class="ld-wrap"><div class="ld-top"><a href="#/practice">Practice</a><span>/</span><span>Mini-capstone</span></div><div class="ld-progress"><span>Fresh-case assessment</span><span>${state.submitted ? "Practice review" : "First unaided attempt"}</span></div><h1>Make the room decision</h1><p class="ld-intro">${attendanceCase.context}</p><section aria-label="Event evidence">${sourceCards(attendanceCase.sources)}</section><form class="ld-form"><fieldset ${done ? "disabled" : ""}><legend>${attendanceCase.prompt}</legend>${optionsHtml(attendanceCase, state)}<label class="ld-field">Expected attendees (people)<input type="number" required step="1" min="0" max="100" name="amount" value="${esc(state.amount || "")}"></label><label class="ld-field">Evidence IDs behind the forecast<input type="text" name="refs" required value="${esc(state.refs || "")}" placeholder="Enter the source IDs"></label><label class="ld-field">Your recommendation to the organizer<textarea name="writing" required minlength="15" rows="3">${esc(state.writing || "")}</textarea></label><label class="ld-field">What evidence would change your conclusion?<textarea name="reconsider" required minlength="12" rows="2">${esc(state.reconsider || "")}</textarea></label><h2>Self-review</h2><p>Mark the criteria your memo meets. Your judgment is saved separately from the three objective checks.</p>${capRubric.map((label, i) => `<label class="ld-option"><input type="checkbox" name="self" value="${i}" ${state.self.includes(i) ? "checked" : ""}><span>${label}</span></label>`).join("")}</fieldset>${done ? "" : `<div class="ld-actions"><button class="ld-primary">Submit recommendation</button></div><p class="ld-saved">Your draft saves as you write. A worked review opens after submission.</p>`}</form>${done ? `<section class="ld-feedback ${state.result.passed ? "is-pass" : "is-retry"}" tabindex="-1"><span class="ld-code">${state.result.score}% on objective checks</span><h2>${state.result.passed ? "Forecast verified." : "Review the forecast."}</h2>${state.result.checks.map((row) => `<p><strong>${row.pass ? "✓" : "↺"} ${row.label}.</strong> ${esc(row.detail)}</p>`).join("")}<details><summary>Worked review</summary><p>${attendanceCase.worked}</p><p>A defensible memo might keep the existing room and request confirmations. A different booking choice can make sense if the cost of turning people away is high. Compare your reasoning with your self-review.</p></details><p class="ld-saved">Recommendation, evidence, calculation, and self-review saved to your portfolio. ${state.self.length}/3 criteria marked by you. Independent review is planned.</p><div class="ld-actions"><a class="ld-primary" href="#/portfolio">Open portfolio</a><button class="ld-link" data-revise>Revise recommendation</button><a href="#/plans">Explore plans</a></div></section>` : ""}</div>`;
    const form = root.querySelector("form");
    form.oninput = (e) => {
      const field = e.target;
      if (field.name === "choice") state.choice = Number(field.value);
      else if (field.name === "self")
        state.self = Array.from(
          form.querySelectorAll('[name="self"]:checked'),
          (el) => Number(el.value),
        );
      else state[field.name] = field.value;
      api.save(state);
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      if (state.result) return;
      const fresh = state.submitted === 0;
      state.result = gradeCapstone(state);
      state.submitted++;
      api.save(state);
      api.finish({
        title: "Make the room decision",
        passed: state.result.passed,
        score: state.result.score,
        fresh,
        hinted: false,
        artifact: {
          recommendation: state.writing,
          forecast: Number(state.amount),
          sources: state.refs,
          sourcePack: attendanceCase.sources,
          decision: attendanceCase.options[state.choice].label,
          reconsider: state.reconsider,
          objectiveResults: state.result.checks,
        },
        rubric: capRubric.map((criterion, i) => ({
          criterion,
          marked: state.self.includes(i),
          reviewer: "Learner self-review",
        })),
      });
      draw(".ld-feedback");
    };
    root.querySelector("[data-revise]")?.addEventListener("click", () => {
      delete state.result;
      api.save(state);
      draw("legend");
    });
    if (focus) {
      const node = root.querySelector(focus);
      node.setAttribute("tabindex", "-1");
      node.focus();
    }
  }
  draw();
}
