# Component provenance

The five shortlisted component sources and demos were retrieved through the connected 21st.dev tools. Praxifold uses browser-native ES modules. The corresponding interaction patterns are implemented locally with original markup, CSS, evidence, artwork and copy.

| Retrieved component | Import and compatibility finding | Praxifold adaptation |
| --- | --- | --- |
| [coss Tabs · 11644](https://21st.dev/@coss.com/components/tabs) | The React source imports `@base-ui/react/tabs`. | Mobile Evidence, Work and Results tabs in `labs.js` keep edits above their panels. Arrow keys, Home and End change the selected tab and update focus. |
| [Resizable · 7082](https://21st.dev/@sean0205/components/resizable-1) | The reference uses the legacy React panel group and resize handle exports. | The named desktop separator resizes the evidence rail with pointer or keyboard input and retains the width in the draft. |
| [Source Citation Rail · 29355](https://21st.dev/@rmahammad/components/source-citation-rail) | The source depends on a helper absent from the retrieved tree. | Launch claims and evidence buttons share one source ID. The excerpt carries a date, and the learner can cite it in the recommendation. |
| [CI/CD Build Log Viewer · 24897](https://21st.dev/@cnippet-dev/components/v-collapsible-9) | The React demo has local utility imports. | Native disclosure rows show the actual source, decision, state and tool output from the local briefing replay. |
| [Pricing Table · 43871](https://21st.dev/@klyv-ui/components/pricing-table) | Its relative helper imports exceed the components supplied in the bundle. | The Plans route maps shared offer records to a responsive comparison of free practice and the planned founding cohort. |

## Rights and dependencies

The links above credit the source authors. Component licenses and marketplace demo/media rights are separate under the [21st.dev terms](https://21st.dev/terms). The distributed app contains original implementations of the interactions and original graphics. It includes no marketplace source files, demo layouts, screenshots or media. No third-party component code or license notice was copied into the release.

The app has zero production npm dependencies. Development uses Vite 6.3.6, TypeScript 5.9.3, ESLint 9.39.1, @eslint/js 9.39.1, globals 16.5.0, Playwright Core 1.56.1 and axe-core 4.10.3. The lockfile records resolved versions. Package distributions retain their own licenses. The [official CLI guide](https://github.com/21st-dev/skill/blob/main/skills/21st-cli-use/SKILL.md) documents catalog search, source retrieval and the skills installer.

The official `npx @21st-dev/cli install-skill` command succeeded. Its installer reported the skills pack installed for Codex, Claude and Cursor. The build and preview operate independently of that installation.
