import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");
const W = 1284;
const H = 2778;

const c = {
  bg: "#050711",
  panel: "#0b1024",
  panel2: "#11162c",
  line: "#2c3558",
  text: "#f6f3ff",
  muted: "#d9ddff",
  cyan: "#32f6ff",
  pink: "#ff85d5",
  green: "#19f7a1",
  purple: "#9b8cff",
  amber: "#ffb84d",
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function frame(content) {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${c.bg}"/>
    <path d="M0 420H1284M0 900H1284M0 1380H1284M0 1860H1284M0 2340H1284" stroke="rgba(50,246,255,0.08)" stroke-width="3"/>
    <circle cx="1110" cy="270" r="210" fill="${c.cyan}" opacity="0.18"/>
    <circle cx="130" cy="2540" r="260" fill="${c.pink}" opacity="0.18"/>
    ${content}
  </svg>`;
}

function titleBlock(title, subtitle) {
  return `
    <text x="72" y="126" font-family="Courier New, monospace" font-size="32" font-weight="900" fill="${c.cyan}">VINYL LOG</text>
    <text x="72" y="232" font-family="Arial, sans-serif" font-size="82" font-weight="900" fill="${c.text}">${esc(title)}</text>
    <text x="78" y="296" font-family="Arial, sans-serif" font-size="32" font-weight="800" fill="${c.muted}">${esc(subtitle)}</text>
  `;
}

function record(x, y, size, accent1, accent2) {
  const r = size / 2;
  return `
    <defs>
      <radialGradient id="record-${x}-${y}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${accent1}"/>
        <stop offset="18%" stop-color="${accent2}"/>
        <stop offset="20%" stop-color="#0b1024"/>
        <stop offset="100%" stop-color="#050711"/>
      </radialGradient>
    </defs>
    <circle cx="${x + r}" cy="${y + r}" r="${r}" fill="url(#record-${x}-${y})" stroke="${accent1}" stroke-width="8"/>
    ${Array.from({ length: 10 }, (_, i) => `<circle cx="${x + r}" cy="${y + r}" r="${70 + i * 22}" fill="none" stroke="rgba(246,243,255,0.12)" stroke-width="3"/>`).join("")}
    <circle cx="${x + r}" cy="${y + r}" r="54" fill="${c.panel}" stroke="${c.text}" stroke-width="8"/>
  `;
}

function logCard(x, y, track, artist, vibe, note, accent1 = c.cyan, accent2 = c.pink) {
  const noteLines = wrap(note, 34).slice(0, 4);
  return `
    <rect x="${x}" y="${y}" width="1060" height="1060" rx="32" fill="${c.panel}" stroke="${c.line}" stroke-width="5"/>
    ${record(x + 72, y + 114, 392, accent1, accent2)}
    <text x="${x + 520}" y="${y + 150}" font-family="Courier New, monospace" font-size="26" font-weight="900" fill="${accent1}">NOW LOGGED</text>
    <text x="${x + 520}" y="${y + 250}" font-family="Arial, sans-serif" font-size="74" font-weight="900" fill="${c.text}">${esc(track)}</text>
    <text x="${x + 524}" y="${y + 318}" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="${accent2}">${esc(artist)}</text>
    <rect x="${x + 520}" y="${y + 370}" width="250" height="70" rx="35" fill="${c.panel2}" stroke="${accent1}" stroke-width="4"/>
    <text x="${x + 645}" y="${y + 416}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="${accent1}">${esc(vibe)}</text>
    <rect x="${x + 72}" y="${y + 580}" width="916" height="230" rx="22" fill="${c.panel2}" stroke="${c.line}" stroke-width="4"/>
    ${noteLines.map((line, i) => `<text x="${x + 110}" y="${y + 652 + i * 46}" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="${c.muted}">${esc(line)}</text>`).join("")}
    <rect x="${x + 72}" y="${y + 875}" width="916" height="76" rx="20" fill="#080b18" stroke="${c.line}" stroke-width="4"/>
    <text x="${x + 110}" y="${y + 925}" font-family="Courier New, monospace" font-size="26" font-weight="900" fill="${accent1}">WALLET + TIMESTAMP SAVED ON BASE</text>
  `;
}

function feature(x, y, title, body, accent) {
  return `
    <rect x="${x}" y="${y}" width="540" height="220" rx="24" fill="${c.panel}" stroke="${c.line}" stroke-width="5"/>
    <rect x="${x}" y="${y}" width="540" height="12" rx="6" fill="${accent}"/>
    <text x="${x + 34}" y="${y + 80}" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="${c.text}">${esc(title)}</text>
    ${wrap(body, 30).slice(0, 3).map((line, i) => `<text x="${x + 34}" y="${y + 132 + i * 34}" font-family="Arial, sans-serif" font-size="27" font-weight="800" fill="${c.muted}">${esc(line)}</text>`).join("")}
  `;
}

function screenshot1() {
  return frame(`
    ${titleBlock("Save a song moment.", "Track, artist, vibe, note, wallet, and timestamp on Base.")}
    ${logCard(112, 430, "Midnight Relay", "Neon Atlas", "Late night", "A clean synth loop for shipping after everyone else has gone quiet.", c.cyan, c.pink)}
    ${feature(72, 1625, "Pick a vibe", "Late night, warm, electric, or dreamy.", c.cyan)}
    ${feature(672, 1625, "Save on Base", "Make the listening note public by ID.", c.pink)}
  `);
}

function screenshot2() {
  return frame(`
    ${titleBlock("Build a tiny music diary.", "Keep the memory short enough to feel immediate.")}
    ${feature(72, 385, "Track + artist", "A clean record of what you played.", c.green)}
    ${feature(672, 385, "Listening note", "One line about why it hit.", c.pink)}
    ${logCard(112, 730, "Golden Static", "Echo Room", "Warm", "Soft drums and bright keys for a slow morning build.", c.amber, c.pink)}
  `);
}

function screenshot3() {
  return frame(`
    ${titleBlock("Reload any log.", "Use Log ID to reopen the card and verify the Base transaction.")}
    ${feature(72, 385, "Log ID", "Read saved song moments by number.", c.cyan)}
    ${feature(672, 385, "BaseScan", "Open the transaction after saving.", c.purple)}
    ${logCard(112, 730, "Glass Current", "North Window", "Dreamy", "A floating loop for sketching ideas before the day gets loud.", c.purple, c.cyan)}
  `);
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${c.bg}"/>
    <rect x="112" y="112" width="800" height="800" rx="88" fill="${c.panel}" stroke="${c.line}" stroke-width="26"/>
    ${record(226, 226, 572, c.cyan, c.pink)}
    <path d="M620 676l132-132" stroke="${c.pink}" stroke-width="34" stroke-linecap="round"/>
    <circle cx="620" cy="676" r="42" fill="${c.text}"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1910" height="1000" fill="${c.bg}"/>
    <circle cx="1720" cy="130" r="230" fill="${c.cyan}" opacity="0.18"/>
    <text x="96" y="170" font-family="Arial, sans-serif" font-size="126" font-weight="900" fill="${c.text}">Vinyl Log</text>
    <text x="104" y="250" font-family="Arial, sans-serif" font-size="44" font-weight="800" fill="${c.muted}">Save song moments on Base.</text>
    ${feature(106, 370, "Music diary", "Track, artist, vibe, note.", c.cyan)}
    ${feature(106, 635, "Onchain record", "Wallet and timestamp saved.", c.pink)}
    ${logCard(760, 74, "Midnight Relay", "Neon Atlas", "Late night", "A clean synth loop for shipping after everyone else has gone quiet.", c.cyan, c.pink)}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).jpeg({ quality: 88, mozjpeg: true }).toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

await writeFile(
  join(outDir, "asset-manifest.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2),
  "utf8",
);

await writeFile(
  join(outDir, "submission-copy.md"),
  [
    "# Vinyl Log",
    "",
    "App Name: Vinyl Log",
    "Tagline: Save a song moment",
    "Description: Save a song moment with track, artist, vibe, note, wallet, and timestamp on Base.",
    "",
    "Domain: https://vinyl-log.vercel.app",
    "",
    "Assets:",
    "- app-icon.jpg",
    "- app-thumbnail.jpg",
    "- screenshot-1.png",
    "- screenshot-2.png",
    "- screenshot-3.png",
  ].join("\n"),
  "utf8",
);

for (const file of files) console.log(file);
