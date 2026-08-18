/** Procedural pixel sprites matching classic Flappy Bird palette from reference shots. */

export const COLORS = {
  sky: "#70c5ce",
  skyDark: "#69c6ce",
  cloud: "#ffffff",
  pipe: "#73bf2e",
  pipeDark: "#548c1e",
  pipeLight: "#9ae04a",
  pipeEdge: "#3d6712",
  pipeHighlight: "#c6f06a",
  ground: "#ded895",
  groundDark: "#e0d591",
  groundLine: "#c2b46a",
  grass: "#9ce059",
  grassDark: "#73bf2e",
  grassDirt: "#d5cc7c",
  birdBody: "#f5c518",
  birdBodyDark: "#e0a800",
  birdBelly: "#f8e79a",
  birdWing: "#f7efc5",
  birdBeak: "#f15a22",
  birdBeakDark: "#c43d12",
  birdLip: "#f7a18b",
  birdEye: "#ffffff",
  birdPupil: "#111111",
  outline: "#111111",
  scoreFill: "#ffffff",
  scoreStroke: "#111111",
  panel: "#ded895",
  panelDark: "#c9be78",
  button: "#e86100",
  buttonDark: "#b84a00",
  medalBronze: "#cd7f32",
  medalSilver: "#c0c0c0",
  medalGold: "#ffd700",
  medalPlatinum: "#e5e4e2",
};

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function px(ctx, x, y, color, s = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, s, s);
}

/** Classic-looking bird frames (wing up / mid / down). */
export function createBirdFrames() {
  const frames = [];
  const poses = ["up", "mid", "down"];

  for (const pose of poses) {
    const c = makeCanvas(17, 12);
    const ctx = c.getContext("2d");

    // outline body
    const body = [
      ".................",
      "......######.....",
      "....##YYYYYY##...",
      "...#YYYYYYYYW#...",
      "..#YYYYYYYYWWW#..",
      ".##YYYYYYYY#W#W#.",
      "#WW##YYYYY##WWW#.",
      "#WWWWW#YYYY#WWW#.",
      ".#YYYY##YYYY###..",
      "..###OO######R#..",
      "....#OOOOOOOR#...",
      ".....###OOOO#....",
    ];

    const wingRow = pose === "up" ? 3 : pose === "mid" ? 5 : 7;
    const map = {
      ".": null,
      "#": COLORS.outline,
      Y: COLORS.birdBody,
      W: COLORS.birdEye,
      O: COLORS.birdBelly,
      R: COLORS.birdBeak,
    };

    for (let y = 0; y < body.length; y++) {
      for (let x = 0; x < body[y].length; x++) {
        const ch = body[y][x];
        if (map[ch]) px(ctx, x, y, map[ch]);
      }
    }

    // pupil
    px(ctx, 12, 4, COLORS.birdPupil);
    // beak detail
    px(ctx, 14, 7, COLORS.birdBeakDark);
    px(ctx, 13, 8, COLORS.birdLip);
    // wing
    const wingY = wingRow;
    ctx.fillStyle = COLORS.outline;
    ctx.fillRect(2, wingY, 6, 3);
    ctx.fillStyle = COLORS.birdWing;
    ctx.fillRect(3, wingY + 1, 4, 1);
    ctx.fillStyle = COLORS.birdBodyDark;
    ctx.fillRect(3, wingY, 4, 1);

    frames.push(c);
  }

  return frames;
}

export function createPipeSprite(height, isTop) {
  const width = 52;
  const lip = 26;
  const h = Math.max(Math.floor(height), lip);
  const c = makeCanvas(width, h);
  const ctx = c.getContext("2d");
  const bodyX = 6;
  const bodyW = width - 12;

  // body
  const bodyY = isTop ? 0 : lip - 4;
  const bodyH = isTop ? h - lip + 4 : h - lip + 4;
  ctx.fillStyle = COLORS.outline;
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

  const grad = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  grad.addColorStop(0, COLORS.pipeEdge);
  grad.addColorStop(0.12, COLORS.pipeDark);
  grad.addColorStop(0.35, COLORS.pipe);
  grad.addColorStop(0.55, COLORS.pipeLight);
  grad.addColorStop(0.75, COLORS.pipe);
  grad.addColorStop(1, COLORS.pipeEdge);
  ctx.fillStyle = grad;
  ctx.fillRect(bodyX + 1, bodyY + 1, bodyW - 2, Math.max(1, bodyH - 2));

  // lip
  const lipY = isTop ? h - lip : 0;
  ctx.fillStyle = COLORS.outline;
  ctx.fillRect(0, lipY, width, lip);
  const lipGrad = ctx.createLinearGradient(0, 0, width, 0);
  lipGrad.addColorStop(0, COLORS.pipeEdge);
  lipGrad.addColorStop(0.15, COLORS.pipeDark);
  lipGrad.addColorStop(0.4, COLORS.pipeLight);
  lipGrad.addColorStop(0.6, COLORS.pipeHighlight);
  lipGrad.addColorStop(0.8, COLORS.pipe);
  lipGrad.addColorStop(1, COLORS.pipeEdge);
  ctx.fillStyle = lipGrad;
  ctx.fillRect(1, lipY + 1, width - 2, lip - 2);

  // lip inner shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  if (isTop) ctx.fillRect(1, lipY + lip - 6, width - 2, 4);
  else ctx.fillRect(1, lipY + 2, width - 2, 4);

  return c;
}

export function createGroundPattern() {
  const c = makeCanvas(24, 16);
  const ctx = c.getContext("2d");
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(0, 0, 24, 6);
  ctx.fillStyle = COLORS.grassDark;
  for (let x = 0; x < 24; x += 4) {
    ctx.fillRect(x, 2, 2, 4);
  }
  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, 6, 24, 10);
  ctx.fillStyle = COLORS.groundLine;
  ctx.fillRect(0, 6, 24, 1);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? COLORS.groundDark : COLORS.grassDirt;
    ctx.fillRect(i * 4, 10 + (i % 3), 3, 2);
  }
  return c;
}

export function createCityscape(width, height) {
  const c = makeCanvas(width, height);
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  const buildings = [
    { x: 0, w: 28, h: 42, windows: true },
    { x: 30, w: 20, h: 28, windows: false },
    { x: 52, w: 34, h: 50, windows: true },
    { x: 90, w: 22, h: 34, windows: true },
    { x: 116, w: 40, h: 46, windows: true },
    { x: 160, w: 24, h: 30, windows: false },
    { x: 188, w: 32, h: 48, windows: true },
    { x: 224, w: 28, h: 36, windows: true },
    { x: 256, w: 32, h: 44, windows: true },
  ];
  for (const b of buildings) {
    const y = height - b.h;
    ctx.fillStyle = "#5e8f96";
    ctx.fillRect(b.x, y, b.w, b.h);
    ctx.fillStyle = "#7aa8ae";
    ctx.fillRect(b.x, y, b.w, 3);
    if (b.windows) {
      ctx.fillStyle = "#d7eef0";
      for (let wy = y + 8; wy < height - 6; wy += 8) {
        for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 6) {
          ctx.fillRect(wx, wy, 3, 4);
        }
      }
    }
  }
  // bushes
  ctx.fillStyle = "#5aaa3a";
  for (let x = 0; x < width; x += 18) {
    ctx.beginPath();
    ctx.ellipse(x + 10, height - 4, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

export function drawScore(ctx, score, x, y, scale = 1) {
  const text = String(score);
  ctx.save();
  ctx.font = `bold ${32 * scale}px "Courier New", monospace`;
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  ctx.lineWidth = 6 * scale;
  ctx.strokeStyle = COLORS.scoreStroke;
  ctx.fillStyle = COLORS.scoreFill;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawOutlinedText(ctx, text, x, y, size, fill = "#fff") {
  ctx.save();
  ctx.font = `bold ${size}px "Courier New", monospace`;
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(4, size / 6);
  ctx.strokeStyle = COLORS.outline;
  ctx.fillStyle = fill;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}
