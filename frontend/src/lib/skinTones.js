export const MONK_SCALE = [
  { label: "MST-1",  name: "Very Light",    hex: "#f6ede4", rgb: [246, 237, 228] },
  { label: "MST-2",  name: "Light",         hex: "#f3e7db", rgb: [243, 231, 219] },
  { label: "MST-3",  name: "Light Medium",  hex: "#f7ead0", rgb: [247, 234, 208] },
  { label: "MST-4",  name: "Medium Light",  hex: "#eadaba", rgb: [234, 218, 186] },
  { label: "MST-5",  name: "Medium",        hex: "#d7bd96", rgb: [215, 189, 150] },
  { label: "MST-6",  name: "Medium Dark",   hex: "#a07850", rgb: [160, 120, 80] },
  { label: "MST-7",  name: "Dark Medium",   hex: "#825c43", rgb: [130, 92, 67] },
  { label: "MST-8",  name: "Dark",          hex: "#604134", rgb: [96, 65, 52] },
  { label: "MST-9",  name: "Very Dark",     hex: "#3a312a", rgb: [58, 49, 42] },
  { label: "MST-10", name: "Deepest",       hex: "#292420", rgb: [41, 36, 32] },
];


export function findClosestTone(input) {
  if (!input) return MONK_SCALE[4];

  const byLabel = MONK_SCALE.find(
    (t) => t.label.toLowerCase() === String(input).toLowerCase()
  );
  if (byLabel) return byLabel;

  const byName = MONK_SCALE.find(
    (t) => t.name.toLowerCase() === String(input).toLowerCase()
  );
  if (byName) return byName;

  if (typeof input === "string" && input.startsWith("#")) {
    const r = parseInt(input.slice(1, 3), 16);
    const g = parseInt(input.slice(3, 5), 16);
    const b = parseInt(input.slice(5, 7), 16);
    let best = MONK_SCALE[0];
    let bestDist = Infinity;
    for (const tone of MONK_SCALE) {
      const d =
        (tone.rgb[0] - r) ** 2 +
        (tone.rgb[1] - g) ** 2 +
        (tone.rgb[2] - b) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = tone;
      }
    }
    return best;
  }

  return MONK_SCALE[4];
}

export function darken(hex, factor = 0.85) {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
