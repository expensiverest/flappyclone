/**
 * Hand-drawn pixel sprites for Flappy Clone.
 *
 * Every sprite below is authored as an ASCII pixel map (or as explicit 1px
 * columns/rows) so the artwork stays crisp at the native 288x512 resolution.
 * The palette was sampled from the reference screenshots in this repo.
 */

export const COLORS = {
  // sky + parallax backdrop
  sky: "#70c5ce",
  cloud: "#ebfcdc",
  cloudShade: "#d6efc4",
  haze: "#e1f0d1",
  building: "#dbeecb",
  buildingDark: "#c9e2b6",
  buildingWindow: "#e9f7dd",
  bush: "#83e38c",
  bushDark: "#5bc86e",
  bushLight: "#a4eda4",

  // pipes
  pipeOutline: "#4a4a2f",
  pipeHighlight: "#d9fe8c",
  pipeLight: "#a1e658",
  pipeMid: "#7bc636",
  pipeBody: "#74bf2e",
  pipeShade: "#6bb02a",
  pipeDark: "#538c21",
  pipeDarker: "#3f6b1a",

  // ground
  groundTop: "#4e4838",
  grass: "#75bf2e",
  grassLight: "#9de756",
  grassDark: "#597e17",
  dirtLight: "#e9dfa4",
  dirt: "#ddd894",
  dirtDark: "#c9bf78",

  // bird
  outline: "#543847",
  birdBody: "#f8d840",
  birdBodyDark: "#e0a731",
  birdBelly: "#fcf4e3",
  birdWhite: "#ffffff",
  birdWingShade: "#d8d8d8",
  birdBeak: "#f97c11",
  birdBeakDark: "#dc5b12",
  birdPupil: "#000000",

  // ui
  panel: "#ded895",
  panelLight: "#f2e9b7",
  panelDark: "#c9be78",
  button: "#ec6e10",
  buttonDark: "#b84a00",
  textFill: "#ffffff",
  gameOver: "#f8813f",
  title: "#ffe14d",
  medalBronze: "#d97b3c",
  medalBronzeDark: "#a4531f",
  medalSilver: "#d5d5d5",
  medalSilverDark: "#9a9a9a",
  medalGold: "#fada4b",
  medalGoldDark: "#c79b1e",
  medalPlatinum: "#8fe1f0",
  medalPlatinumDark: "#4fa8bd",
};

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.floor(w));
  c.height = Math.max(1, Math.floor(h));
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return c;
}

/** Paint an ASCII pixel map onto a context using a char -> color map. */
function paintMap(ctx, rows, palette, ox = 0, oy = 0) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

/** Paint a list of [count, color] pairs as 1px vertical columns. */
function paintColumns(ctx, columns, x0, y0, height) {
  let x = x0;
  for (const [count, color] of columns) {
    if (color) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y0, count, height);
    }
    x += count;
  }
  return x - x0;
}

/* ------------------------------------------------------------------ bird */

const BIRD_BODY = [
  ".....#####.......",
  "...##YYYYY##.....",
  "..#YYYYYYYYY##...",
  ".#YYYYYYYYYWWB#..",
  "#YYYYYYYYYYWWB#..",
  "#YYYYYYYYYYWWB#..",
  "#YYYYYYYYYY#OOO#.",
  "#YYYYYYYYY#OOOO#.",
  ".#SSSSSSSS#RRR#..",
  "..#CCCCCCCC###...",
  "...##CCCCCC##....",
  ".....######......",
];

const BIRD_WING = [".#####.", "#WWWWW#", "#GGGGG#", ".#####."];

export const BIRD_W = 17;
export const BIRD_H = 12;

/** Bird frames: wing up, wing mid, wing down. */
export function createBirdFrames() {
  const bodyPalette = {
    "#": COLORS.outline,
    Y: COLORS.birdBody,
    S: COLORS.birdBodyDark,
    C: COLORS.birdBelly,
    W: COLORS.birdWhite,
    B: COLORS.birdPupil,
    O: COLORS.birdBeak,
    R: COLORS.birdBeakDark,
  };
  const wingPalette = {
    "#": COLORS.outline,
    W: COLORS.birdWhite,
    G: COLORS.birdWingShade,
  };

  return [3, 5, 7].map((wingY) => {
    const c = makeCanvas(BIRD_W, BIRD_H);
    const ctx = c.getContext("2d");
    paintMap(ctx, BIRD_BODY, bodyPalette);
    paintMap(ctx, BIRD_WING, wingPalette, 1, wingY);
    return c;
  });
}

/* ----------------------------------------------------------------- pipes */

export const PIPE_BODY_W = 46;
export const PIPE_CAP_W = 52;
export const PIPE_CAP_H = 26;

const PIPE_COLUMNS = [
  [1, COLORS.pipeOutline],
  [1, COLORS.pipeDark],
  [2, COLORS.pipeLight],
  [2, COLORS.pipeHighlight],
  [9, COLORS.pipeLight],
  [2, COLORS.pipeMid],
  [2, COLORS.pipeLight],
  [16, COLORS.pipeBody],
  [4, COLORS.pipeShade],
  [4, COLORS.pipeDark],
  [1, COLORS.pipeDarker],
  [1, COLORS.pipeDarker],
  [1, COLORS.pipeOutline],
];

/** Wider column run for the cap (same shading, 6px more body green). */
const CAP_COLUMNS = PIPE_COLUMNS.map((col, i) => (i === 7 ? [col[0] + 6, col[1]] : col));

/**
 * Pipe pieces. The body is a short vertical slice that is stretched by the
 * renderer (all shading is vertical, so stretching stays pixel exact).
 */
export function createPipeParts() {
  const body = makeCanvas(PIPE_BODY_W, 8);
  paintColumns(body.getContext("2d"), PIPE_COLUMNS, 0, 0, 8);

  const cap = makeCanvas(PIPE_CAP_W, PIPE_CAP_H);
  const ctx = cap.getContext("2d");
  paintColumns(ctx, CAP_COLUMNS, 0, 0, PIPE_CAP_H);
  ctx.fillStyle = COLORS.pipeOutline;
  ctx.fillRect(0, 0, PIPE_CAP_W, 1);
  ctx.fillRect(0, PIPE_CAP_H - 1, PIPE_CAP_W, 1);
  ctx.fillStyle = COLORS.pipeDarker;
  ctx.fillRect(1, PIPE_CAP_H - 2, PIPE_CAP_W - 2, 1);

  return { body, cap };
}

/* ---------------------------------------------------------------- ground */

export const GROUND_TILE_W = 24;
export const GROUND_H = 112;

export function createGroundTile() {
  const c = makeCanvas(GROUND_TILE_W, GROUND_H);
  const ctx = c.getContext("2d");

  ctx.fillStyle = COLORS.groundTop;
  ctx.fillRect(0, 0, GROUND_TILE_W, 1);

  // grass band with diagonal stripes
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(0, 1, GROUND_TILE_W, 9);
  ctx.fillStyle = COLORS.grassLight;
  for (let i = -2; i < GROUND_TILE_W / 4 + 2; i++) {
    for (let y = 0; y < 8; y++) {
      ctx.fillRect(i * 8 + y, 1 + y, 4, 1);
    }
  }
  ctx.fillStyle = COLORS.grassDark;
  ctx.fillRect(0, 10, GROUND_TILE_W, 2);

  // dirt with a lighter top edge and dashed texture
  ctx.fillStyle = COLORS.dirtLight;
  ctx.fillRect(0, 12, GROUND_TILE_W, 3);
  ctx.fillStyle = COLORS.dirt;
  ctx.fillRect(0, 15, GROUND_TILE_W, GROUND_H - 15);
  ctx.fillStyle = COLORS.dirtDark;
  for (let y = 20; y < GROUND_H; y += 12) {
    ctx.fillRect(2, y, 6, 2);
    ctx.fillRect(14, y + 6, 6, 2);
  }
  return c;
}

/* ------------------------------------------------------- parallax layers */

export const CLOUD_H = 26;
export const CITY_H = 44;
export const BUSH_H = 28;

/** Puffy cloud strip; tiles seamlessly across `width`. */
export function createCloudLayer(width) {
  const c = makeCanvas(width, CLOUD_H);
  const ctx = c.getContext("2d");
  ctx.fillStyle = COLORS.cloud;
  ctx.fillRect(0, 10, width, CLOUD_H - 10);

  const puff = (cx, r) => {
    ctx.fillStyle = COLORS.cloud;
    for (let y = -r; y <= 0; y++) {
      const half = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
      ctx.fillRect(cx - half, 10 + y, half * 2, 1);
    }
  };
  const radii = [8, 5, 10, 6, 7, 4, 9, 6];
  let x = 0;
  let i = 0;
  while (x < width + 24) {
    const r = radii[i % radii.length];
    puff(x + r, r);
    x += r * 2 - 2;
    i++;
  }
  return c;
}

/** Pale skyline drawn on the haze band. */
export function createCityLayer(width) {
  const c = makeCanvas(width, CITY_H);
  const ctx = c.getContext("2d");
  ctx.fillStyle = COLORS.haze;
  ctx.fillRect(0, 0, width, CITY_H);

  const plan = [
    [10, 14, 20],
    [26, 10, 30],
    [38, 16, 24],
    [56, 12, 34],
    [70, 18, 26],
    [92, 12, 18],
    [106, 16, 32],
    [126, 10, 22],
    [140, 20, 28],
    [164, 12, 36],
    [180, 14, 20],
    [198, 18, 30],
    [220, 10, 24],
    [234, 16, 34],
    [254, 12, 22],
    [270, 14, 28],
  ];
  for (const [bx, bw, bh] of plan) {
    const x = bx % width;
    const y = CITY_H - bh;
    ctx.fillStyle = COLORS.building;
    ctx.fillRect(x, y, bw, bh);
    ctx.fillStyle = COLORS.buildingDark;
    ctx.fillRect(x + bw - 3, y, 3, bh);
    ctx.fillStyle = COLORS.buildingWindow;
    for (let wy = y + 3; wy < CITY_H - 4; wy += 5) {
      for (let wx = x + 2; wx < x + bw - 4; wx += 4) {
        ctx.fillRect(wx, wy, 2, 3);
      }
    }
  }
  return c;
}

/** Rounded bushes that sit just above the ground. */
export function createBushLayer(width) {
  const c = makeCanvas(width, BUSH_H);
  const ctx = c.getContext("2d");
  ctx.fillStyle = COLORS.bush;
  ctx.fillRect(0, 12, width, BUSH_H - 12);

  const mound = (cx, r, color) => {
    ctx.fillStyle = color;
    for (let y = -r; y <= 0; y++) {
      const half = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
      ctx.fillRect(cx - half, 12 + y, half * 2, 1);
    }
  };
  const radii = [9, 6, 11, 7, 8, 5, 10, 6];
  let x = -6;
  let i = 0;
  while (x < width + 24) {
    const r = radii[i % radii.length];
    mound(x + r, r, COLORS.bush);
    mound(x + r, Math.max(2, r - 4), COLORS.bushLight);
    x += r * 2 - 4;
    i++;
  }
  ctx.fillStyle = COLORS.bushDark;
  ctx.fillRect(0, BUSH_H - 3, width, 3);
  return c;
}

/* ------------------------------------------------------------ pixel font */

const FONT = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#.#.#", "#..##", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  3: ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  6: [".###.", "#...#", "#....", "####.", "#...#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  9: [".###.", "#...#", "#...#", ".####", "....#", "#...#", ".###."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".....", "..#.."],
  ":": [".....", "..#..", "..#..", ".....", "..#..", "..#..", "....."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
};

const GLYPH_W = 5;
const GLYPH_H = 7;

export function textWidth(text, scale = 1) {
  return text.length * (GLYPH_W + 1) * scale - scale;
}

/**
 * Draw pixel text with a 1px (scaled) outline.
 * `align` is "left" | "center" | "right"; `y` is the glyph top.
 */
export function drawText(ctx, text, x, y, options = {}) {
  const {
    scale = 2,
    fill = COLORS.textFill,
    outline = COLORS.outline,
    align = "center",
  } = options;

  const str = String(text).toUpperCase();
  const w = textWidth(str, scale);
  let startX = x;
  if (align === "center") startX = Math.round(x - w / 2);
  if (align === "right") startX = Math.round(x - w);
  startX = Math.round(startX);
  const startY = Math.round(y);

  const cells = [];
  for (let i = 0; i < str.length; i++) {
    const glyph = FONT[str[i]] || FONT[" "];
    const gx = startX + i * (GLYPH_W + 1) * scale;
    for (let gy = 0; gy < GLYPH_H; gy++) {
      for (let cx = 0; cx < GLYPH_W; cx++) {
        if (glyph[gy][cx] === "#") cells.push([gx + cx * scale, startY + gy * scale]);
      }
    }
  }

  if (outline) {
    ctx.fillStyle = outline;
    for (const [cx, cy] of cells) {
      ctx.fillRect(cx - scale, cy, scale, scale);
      ctx.fillRect(cx + scale, cy, scale, scale);
      ctx.fillRect(cx, cy - scale, scale, scale);
      ctx.fillRect(cx, cy + scale, scale, scale);
    }
  }
  ctx.fillStyle = fill;
  for (const [cx, cy] of cells) ctx.fillRect(cx, cy, scale, scale);

  return w;
}

/** Big centred score readout, classic white-on-black-outline digits. */
export function drawScore(ctx, score, x, y, scale = 4) {
  drawText(ctx, String(score), x, y, { scale, align: "center" });
}

/* ---------------------------------------------------------------- medals */

const MEDAL = [
  "..######..",
  ".#LLLLLL#.",
  "#LLLLLLLL#",
  "#LLDDDDLL#",
  "#LDDDDDDL#",
  "#LDDDDDDL#",
  "#LLDDDDLL#",
  "#LLLLLLLL#",
  ".#LLLLLL#.",
  "..######..",
];

export function createMedal(kind) {
  const tones = {
    bronze: [COLORS.medalBronze, COLORS.medalBronzeDark],
    silver: [COLORS.medalSilver, COLORS.medalSilverDark],
    gold: [COLORS.medalGold, COLORS.medalGoldDark],
    platinum: [COLORS.medalPlatinum, COLORS.medalPlatinumDark],
  };
  const [light, dark] = tones[kind] || tones.bronze;
  const c = makeCanvas(10, 10);
  const ctx = c.getContext("2d");
  paintMap(ctx, MEDAL, { "#": COLORS.outline, L: light, D: dark });
  // small shine
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillRect(2, 2, 2, 1);
  ctx.fillRect(2, 3, 1, 1);
  return c;
}

/* -------------------------------------------------------------- ui parts */

/** Nine-slice-ish panel with the classic tan scoreboard look. */
export function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = COLORS.outline;
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = COLORS.panelLight;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = COLORS.panelDark;
  ctx.fillRect(x + 2, y + h - 6, w - 4, 4);
}

export function drawButton(ctx, x, y, w, h, label) {
  ctx.fillStyle = COLORS.outline;
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = COLORS.button;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = COLORS.buttonDark;
  ctx.fillRect(x, y + h - 5, w, 5);
  drawText(ctx, label, x + w / 2, y + Math.round((h - GLYPH_H * 2) / 2), {
    scale: 2,
    align: "center",
  });
}
