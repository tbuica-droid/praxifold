# Praxifold

A browser-based AI practice studio. The private beta includes twelve drills with alternate transfer cases, three signature labs and an event-attendance capstone. Guests can start immediately, revisit missed skills and export their work.

## Run locally

Use Node.js 22 and npm. From this directory:

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:5173/>. Vite prints the active port if 5173 is occupied. The build runs entirely in the browser. No environment file is required.

## Verify

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

With the dev server running and Google Chrome installed, run `npm run qa`. Set `PREVIEW_URL` to check another local server. The browser suite uses an isolated profile and writes screenshots to `qa/screenshots/`. The production output in `dist/` can be served by any static HTTP server. For a private production-build preview, run `npm exec vite preview -- --host 127.0.0.1`.

## Implementation

- `app.js` renders the landing page, practice home, skill map, reviews, portfolio and Plans. The hash routes support direct links and browser history.
- `lessons.js` defines the authored drill cases, objective graders and capstone self-review. A successful first unaided transfer attempt records a demonstration. A retry can improve a practice score.
- `labs.js` contains the seeded account export, bounded research replay and trained decision stump. The launch CSV has 200 rows, 198 accounts, 80 eligible accounts and 32 eligible activations. The model lab fits on 120 teams and evaluates the same 40 held-out teams after each feature change.
- `store.js` maintains versioned local drafts, attempts, review dates, artifacts and pilot events. Results preserve the evidence and inputs used for assessment. A missed check schedules review for the following day. A successful retry moves it seven days out.
- `art.js`, `mark.svg` and the screen styles implement the original mark, diagrams and paper surfaces. Component sources, versions and adaptation decisions are recorded in [COMPONENTS.md](COMPONENTS.md).

## Pilot measurement and availability

Progress belongs to this browser and origin. Portfolio JSON exports include the selected attempt, work, evidence and grading data. Clearing site data removes local progress.

Analytical events contain an event type, activity ID and timestamp. The guest store keeps learner text in the draft and artifact records. `metrics(state)` reports the number of initially missed activities later passed divided by all initially missed activities. Day-seven return measures guests returning during the eighth 24-hour interval after first use, among guests old enough to have reached it. Plan views and actual interest submissions have separate counts. When aggregating across a pilot, count unique guests exposed to Plans for the paid-intent denominator. Metrics are local to each guest, with no network collector configured.

The agent is a labeled, deterministic replay over a synthetic file pack. Model training runs locally. A live provider integration requires a server credential and bounded service. Pro packs, human review and founding-cohort enrollment are planned. The preview has no configured owner-accessible interest endpoint, approved checkout price or billing service.

## Curriculum references

The decision memo and source pack use a realistic work-product brief modeled on [GDPval](https://openai.com/index/gdpval/). The replay treats permissions, verification and completion gates as parts of an agent's environment, following [Harness engineering](https://openai.com/index/harness-engineering/). The classifier lab uses training, a fixed holdout and baseline comparisons informed by [Google's Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course/). All cases and fixture records are original.

## Release verification

Lint, TypeScript checks, ten unit tests and the production build passed. The Chrome suite submitted every drill, completed all three labs, exported the capstone and reopened the saved attempt. It also exercised technical-failure recovery, the CSV download, review scheduling, keyboard operation and persisted mobile drafts.

The layout sweep covered ten routes in both themes at 1440, 768, 390 and 320 pixels. Forty automated accessibility scans covered desktop and phone layouts using axe-core's WCAG A/AA rule tags. There were zero reported violations in those scans and zero browser errors. This was a Chrome check. Independent screen-reader and cross-browser audits remain outside the recorded results.

[Desktop landing](qa/screenshots/landing-desktop.png) · [Practice home](qa/screenshots/practice.png) · [Drill feedback](qa/screenshots/drill-feedback.png) · [Lab result](qa/screenshots/lab-result.png) · [Mobile replay](qa/screenshots/mobile-lab-dark.png) · [Mobile Plans](qa/screenshots/plans-mobile.png)

## Placement and personalization

Open `#/placement` for a nine-question check across the three paths. The quiz saves each answer locally and supports pausing, going back and retaking it. A completed placement stays active during a retake. Results explain each answer. Practice home, the skill map and the next-challenge link use the learner’s placement and passed activities.

The plan prioritizes drills for missed or unsure answers, starting with the least-supported path. A learner’s selected interest breaks ties. Labs follow the drills, with the capstone last. Quiz answers guide practice and grant no portfolio credentials. See [research and assessment design](PLACEMENT-RESEARCH.md). Run `npm run qa:placement` against the local preview for the quiz-specific Chrome checks.

## Expert curriculum research

[From a first AI challenge to independent practice](EXPERTISE-RESEARCH.md) audits the playable beta against academic curricula and institutional guidance. It maps the remaining competencies, specialty projects and evidence needed to assess independent work.

## Public site

[Praxifold on GitHub Pages](https://tbuica-droid.github.io/praxifold/) serves the production build from the root of the `gh-pages` branch. To release a committed update from this checkout, push the source to `main`, then run `bash scripts/publish-pages.sh`. The script checks the source, builds for the project URL and publishes the static assets.
