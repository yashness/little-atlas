// Original Little Atlas vector artwork; no generated flag or border diagrams.
const ICONS = {
  compass:
    '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
  game: '<path d="M7 6h10c3 0 5 12 2 12-2 0-3-3-4-3H9c-1 0-2 3-4 3C2 18 4 6 7 6Z"/><path d="M7 9v5m-2.5-2.5h5M16 10h.01M18 13h.01"/>',
  passport:
    '<rect x="5" y="3" width="15" height="19" rx="2"/><path d="M5 6H3m2 4H3m2 4H3m2 4H3m7 0h5"/><circle cx="12.5" cy="10" r="4"/><path d="M9 10h7m-3.5-4c-2 2-2 6 0 8 2-2 2-6 0-8"/>',
  sound:
    '<path d="M10 5 5 9H2v6h3l5 4V5Zm4 3c2 2 2 6 0 8m3-11c4 4 4 10 0 14"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  spark:
    '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  heart:
    '<path d="M20 5c-3-3-6-1-8 1C10 4 7 2 4 5c-5 5 3 12 8 15 5-3 13-10 8-15Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  pin: '<path d="M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  leaf: '<path d="M5 19C0 6 11 3 21 3c0 10-5 19-16 16Zm0 0L16 8"/>',
};

export const icon = (name: string): string =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name as keyof typeof ICONS] || ICONS.spark}</svg>`;
export const flag = (code: string): string => `assets/flags/${code}.svg`;
export function mascot(): string {
  return `<svg viewBox="0 0 160 160" aria-hidden="true"><path d="m48 120-8 23m69-23 12 22" stroke="#334c43" stroke-width="9" stroke-linecap="round"/><path d="M39 144H26m95 0h13" stroke="#334c43" stroke-width="9" stroke-linecap="round"/><path d="M25 89 8 77m125 11 17-21" stroke="#334c43" stroke-width="7" stroke-linecap="round"/><circle cx="79" cy="78" r="56" fill="#95cbd0" stroke="#355b52" stroke-width="3"/><path d="m32 51 19-10 17 9 1 16-13 11-9 16-17-3m80-58-15 20 8 12-6 16 14 5 12-9 13 3m-72 29 18-9 19 10-4 23-13 7-11-9Z" fill="#bbd69b"/><ellipse cx="59" cy="78" rx="4" ry="6" fill="#2b4840"/><ellipse cx="98" cy="78" rx="4" ry="6" fill="#2b4840"/><path d="M70 91q9 11 18 0" fill="none" stroke="#2b4840" stroke-width="3" stroke-linecap="round"/><ellipse cx="48" cy="91" rx="7" ry="4" fill="#f0a589"/><ellipse cx="109" cy="91" rx="7" ry="4" fill="#f0a589"/><path d="M24 40q56-14 110 1" stroke="#c69a60" stroke-width="11" stroke-linecap="round"/><path d="M44 34 52 9q26-13 54 4l11 24Z" fill="#e6bc7d" stroke="#b88951" stroke-width="2"/><path d="m47 28 66 4" stroke="#94724a" stroke-width="7"/><path d="m70 119 28 0-4 13-12-5-12 8Z" fill="#e77d50"/></svg>`;
}
