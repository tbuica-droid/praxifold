# How the AI skills check was designed

The check helps a learner choose a useful first activity in Praxifold. It samples nine decisions across the three playable paths. Each item names the information the learner has, asks for one decision or calculation, and links the result to a drill that practices that skill.

## Research behind the design

| Source | What informed this check |
| --- | --- |
| U.S. Department of Labor, [AI Literacy Framework](https://www.dol.gov/node/185325) (2026) | The workforce framework includes directing AI, evaluating its output and using it responsibly. A check on prompt writing alone would miss important decisions. Learners specify a checkable handoff, inspect a generated claim and choose when an editor should approve a draft containing private information. |
| Long and Magerko, [What is AI Literacy?](https://aiunplugged.lmc.gatech.edu/wp-content/uploads/sites/36/2020/08/CHI-2020-AI-Literacy-Paper-Camera-Ready.pdf) (CHI 2020) | Their framework includes data literacy, interpreting data and understanding human roles in AI. The model questions use familiar settings to test what a score means and what information a model could actually use. They require no programming experience. |
| Jin and colleagues, [The Generative AI Literacy Assessment Test](https://doi.org/10.1016/j.caeai.2025.100436) (2025) | In their study of 355 higher-education students, scores on their 20-item test predicted performance on GenAI-assisted tasks better than self-rated proficiency. This motivated asking learners to do something observable. Their validation applies to their instrument and population. Praxifold uses original questions and makes a provisional practice recommendation. |
| Mislevy, Almond and Lukas, [A Brief Introduction to Evidence-Centered Design](https://cresst.org/wp-content/uploads/R632.pdf) | Their approach connects what an assessment aims to infer with an observable response and a task that can elicit it. For example, the shop case gives the time each field becomes available. Choosing the final labor charge as the unusable feature is evidence that the learner recognized prediction-time leakage in that case. |
| NIST, [Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) (2024) | NIST describes risks around information integrity, privacy and overreliance. The library question asks what its citation supports. The newsletter question asks where a human can still catch a disclosure before publication. |
| W3C, [Understanding minimum contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | Ordinary text needs at least 4.5:1 contrast at AA. W3C also explains that thin strokes can appear faint even when the nominal contrast passes. The question brief, numbers, units, prompt and answer choices warrant legible weight and full-strength foreground text in both themes. |

## Question coverage

| Path | Observable decisions | Follow-up drills |
| --- | --- | --- |
| Use AI well | Check what a citation supports, specify a verifiable handoff, recalculate a percentage using the relevant group. | D3, D2, D4 |
| Build with AI | Select a workflow for repeatable arithmetic, put approval before publication, retrieve the policy with authority. | D9, D8, D7 |
| Understand models | Compare accuracy with a simple baseline, identify information unavailable at prediction time, test whether examples in a prompt improve its results on fresh messages. | D11, D11, D12 |

Three items per path give a small sample. A correct choice can reflect recognition or a guess. Completing a lab on a new case gives stronger evidence of independent skill. The thresholds and recommendations are product decisions. A pilot could check whether recommended drills fit learners’ needs by comparing first unaided attempts with their placement results and asking where question wording caused confusion.
