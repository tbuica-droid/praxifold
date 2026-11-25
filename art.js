export const paths = [
  {
    id: "use",
    title: "Use AI well",
    desc: "Turn messy evidence into a decision you can defend.",
    lab: "launch",
    project: "Make a launch decision",
    icon: "layers",
  },
  {
    id: "build",
    title: "Build with AI",
    desc: "Build reliable workflows and diagnose where they break.",
    lab: "agent",
    project: "Repair a research assistant",
    icon: "workflow",
  },
  {
    id: "understand",
    title: "Understand models",
    desc: "Train small models and find out what their scores hide.",
    lab: "model",
    project: "Investigate a suspicious classifier",
    icon: "model",
  },
];
const shapes = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  moon: '<path d="M20 15A9 9 0 0 1 9 4a8 8 0 1 0 11 11Z"/>',
  layers: '<path d="m3 8 9-5 9 5-9 5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  workflow:
    '<rect x="2" y="9" width="5" height="6" rx="1"/><rect x="17" y="2" width="5" height="6" rx="1"/><rect x="17" y="16" width="5" height="6" rx="1"/><path d="M7 12h5V5h5m-5 7v7h5"/>',
  model:
    '<circle cx="4" cy="6" r="2"/><circle cx="4" cy="18" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="20" cy="6" r="2"/><circle cx="20" cy="18" r="2"/><path d="m6 7 4 4m4 2 4 4M6 17l4-4m4-2 4-4"/>',
  book: '<path d="M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3Zm9 2v15"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  flask: '<path d="M9 3h6m-5 0v6L4 19q-1 2 2 2h12q3 0 2-2l-6-10V3M7 15h10"/>',
  play: '<path d="m7 4 13 8-13 8Z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  file: '<path d="M5 3h10l4 4v14H5ZM15 3v5h4M8 12h8M8 16h6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  map: '<path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2ZM9 3v15m6-12v15"/>',
  up: '<path d="M6 18 18 6M6 6h12v12"/>',
};
export const icon = (name, size = 18) =>
  '<svg aria-hidden="true" width="' +
  size +
  '" height="' +
  size +
  '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">' +
  (shapes[name] || "") +
  "</svg>";
export function artwork(id) {
  const inner =
    id === "use"
      ? `<g stroke="#45659a" stroke-width="1.6" stroke-linejoin="round"><path d="m101 81 77-39 68 32-77 42Z" fill="#8ca8de"/><path d="m101 75 77-39 68 32-77 42Z" fill="#d9e6fd"/><path d="m101 68 77-39 68 32-77 42Z" fill="#b0c7f0"/><path d="m101 61 77-39 68 32-77 42Z" fill="#f3f7ff"/><path d="m119 60 56-28 14 7-55 28Z" fill="#b4c9f3"/><path d="m146 73 54-27m-46 31 45-23"/></g>`
      : id === "build"
        ? `<g fill="none" stroke="#927342" stroke-width="2"><path d="m175 66 31-18h24m-55 18 31 17h24m-95-17h40"/><g fill="#f7e8ca"><path d="m88 62 26-15 26 15v8l-26 15-26-15Z"/><path d="m88 62 26 15 26-15m-26 15v8"/><path d="m148 61 26-15 26 15v8l-26 15-26-15Z" fill="#ddb477"/><path d="m148 61 26 15 26-15m-26 15v8"/><path d="m217 39 22-12 22 12v7l-22 12-22-12Zm0 41 22-12 22 12v7l-22 12-22-12Z"/><path d="m217 39 22 12 22-12m-22 12v7m-22 22 22 12 22-12m-22 12v7"/></g></g>`
        : `<g stroke="#467c68" stroke-width="1.8"><path d="m104 42 64-17-64 63 64-22-64-24 64 64 72-43-72-38m0 41 72-3" fill="none"/>${[
            [104, 42],
            [104, 88],
            [168, 25],
            [168, 66],
            [168, 106],
            [240, 63],
          ]
            .map(
              ([x, y], i) =>
                `<circle cx="${x}" cy="${y}" r="9" fill="${i === 5 ? "#4d9676" : i > 1 ? "#a5ceba" : "#eaf5ea"}"/>`,
            )
            .join("")}</g>`;
  return (
    '<div class="art ' +
    id +
    '"><svg viewBox="0 0 350 132" aria-hidden="true">' +
    inner +
    "</svg></div>"
  );
}
