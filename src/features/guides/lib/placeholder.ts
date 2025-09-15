// Generates a 16:9 SVG data URL with a soft gradient + centered label.
// Use for GuideCard cover when post.cover is missing.

const PALETTES: [string, string][] = [
  ["#444654", "#2e3036"],
  ["#2c3e50", "#4b79a1"],
  ["#3a3c42", "#5a5c62"],
  ["#335c67", "#1d3557"],
  ["#3f2b96", "#a8c0ff"],
  ["#3e5151", "#decba4"],
];

function hash(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function makeGuidePlaceholder(imageTitle: string, tags: string[] = []): string {
  const h = hash(imageTitle + "|" + tags.join(","));
  const [a, b] = PALETTES[h % PALETTES.length];

  const svg =
`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a}" />
      <stop offset="100%" stop-color="${b}" />
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <g fill="rgba(0,0,0,.22)"><rect x="40" y="40" width="1200" height="640" rx="16"/></g>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
        font-family="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Arial"
        font-size="80" fill="rgba(255,255,255,.9)">${imageTitle}</text>
</svg>`;

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
