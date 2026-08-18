import {
  COLORS,
  BIRD_W,
  BIRD_H,
  PIPE_BODY_W,
  PIPE_CAP_W,
  PIPE_CAP_H,
  GROUND_TILE_W,
  GROUND_H,
  CLOUD_H,
  CITY_H,
  BUSH_H,
  createBirdFrames,
  createPipeParts,
  createGroundTile,
  createCloudLayer,
  createCityLayer,
  createBushLayer,
  createMedal,
  drawText,
  drawScore,
  drawPanel,
  drawButton,
} from "./sprites.js";

const W = 288;
const H = 512;
const PLAY_H = H - GROUND_H;

// backdrop bands (bottom aligned to the ground line)
const BUSH_Y = PLAY_H - BUSH_H;
const CITY_Y = BUSH_Y - CITY_H + 8;
const CLOUD_Y = CITY_Y - CLOUD_H + 6;

const BIRD_SCALE = 2;
const BIRD_DRAW_W = BIRD_W * BIRD_SCALE;
const BIRD_DRAW_H = BIRD_H * BIRD_SCALE;
const BIRD_X = 68;

const GRAVITY = 0.42;
const FLAP = -6.8;
const PIPE_W = PIPE_CAP_W;
const PIPE_GAP = 120;
const PIPE_SPEED = 2.15;
const PIPE_SPACING = 172;

const State = {
  TITLE: "title",
  READY: "ready",
  PLAY: "play",
  DEAD: "dead",
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.birdFrames = createBirdFrames();
    this.pipe = createPipeParts();
    this.ground = createGroundTile();
    this.clouds = createCloudLayer(W);
    this.city = createCityLayer(W);
    this.bushes = createBushLayer(W);
    this.medals = {
      bronze: createMedal("bronze"),
      silver: createMedal("silver"),
      gold: createMedal("gold"),
      platinum: createMedal("platinum"),
    };

    this.best = Number(localStorage.getItem("flappyclone_best") || 0);
    this.reset(true);

    this._bindInput();
    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  reset(toTitle = false) {
    this.state = toTitle ? State.TITLE : State.READY;
    this.bird = {
      x: BIRD_X,
      y: PLAY_H * 0.42,
      vy: 0,
      rot: 0,
      frame: 0,
      frameT: 0,
      alive: true,
    };
    this.pipes = [];
    this.score = 0;
    this.newBest = false;
    this.scroll = 0;
    this.groundX = 0;
    this.flash = 0;
    this.deadT = 0;
    this.readyT = 0;
    this.spawnX = W + 30;
  }

  _bindInput() {
    const flap = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      this.onFlap();
    };
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.key === " ") {
        e.preventDefault();
        this.onFlap();
      }
      if (e.code === "KeyR" && this.state === State.DEAD) this.reset(false);
    });
    this.canvas.addEventListener("pointerdown", flap);
    this.canvas.addEventListener("touchstart", flap, { passive: false });
  }

  onFlap() {
    if (this.state === State.TITLE) {
      this.state = State.READY;
      this.readyT = 0;
      return;
    }
    if (this.state === State.READY) {
      this.state = State.PLAY;
      this.bird.vy = FLAP;
      this._ensurePipes();
      return;
    }
    if (this.state === State.PLAY && this.bird.alive) {
      this.bird.vy = FLAP;
      return;
    }
    if (this.state === State.DEAD && this.deadT > 0.55) {
      this.reset(false);
    }
  }

  _ensurePipes() {
    while (this.pipes.length < 4) {
      const last = this.pipes[this.pipes.length - 1];
      const x = last ? last.x + PIPE_SPACING : this.spawnX;
      this.pipes.push(this._makePipe(x));
    }
  }

  _makePipe(x) {
    const margin = 48;
    const gapY = margin + Math.random() * (PLAY_H - PIPE_GAP - margin * 2);
    return { x, gapY, gapH: PIPE_GAP, scored: false };
  }

  loop(t) {
    const dt = Math.min(0.033, (t - this.last) / 1000);
    this.last = t;
    this.update(dt);
    this.draw();
    requestAnimationFrame((nt) => this.loop(nt));
  }

  update(dt) {
    if (this.state !== State.DEAD) {
      const speed = this.state === State.PLAY ? 1 : 0.7;
      this.groundX = (this.groundX - PIPE_SPEED * speed) % GROUND_TILE_W;
      this.scroll += dt * speed;
    }

    if (this.state === State.TITLE || this.state === State.READY) {
      this.bird.y = PLAY_H * 0.42 + Math.sin(this.scroll * 4.2) * 6;
      this.bird.vy = 0;
      this.bird.rot = 0;
      this.bird.frameT += dt;
      if (this.bird.frameT > 0.12) {
        this.bird.frameT = 0;
        this.bird.frame = (this.bird.frame + 1) % 3;
      }
      if (this.state === State.READY) this.readyT += dt;
      return;
    }

    if (this.state === State.PLAY) {
      this.bird.vy += GRAVITY;
      this.bird.y += this.bird.vy;
      this.bird.rot = clamp(this.bird.vy * 0.08, -0.55, 1.25);
      this.bird.frameT += dt;
      if (this.bird.frameT > 0.08) {
        this.bird.frameT = 0;
        this.bird.frame = (this.bird.frame + 1) % 3;
      }

      for (const p of this.pipes) p.x -= PIPE_SPEED;
      if (this.pipes[0] && this.pipes[0].x + PIPE_W < -10) this.pipes.shift();
      this._ensurePipes();

      for (const p of this.pipes) {
        if (!p.scored && p.x + PIPE_W < BIRD_X) {
          p.scored = true;
          this.score += 1;
          if (this.score > this.best) {
            this.best = this.score;
            this.newBest = true;
            localStorage.setItem("flappyclone_best", String(this.best));
          }
        }
      }

      if (this._collides()) this._die();
      return;
    }

    if (this.state === State.DEAD) {
      this.deadT += dt;
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 4);
      this.bird.vy += GRAVITY * 1.15;
      this.bird.y += this.bird.vy;
      this.bird.rot = clamp(this.bird.rot + dt * 4, -0.5, 1.5);
      if (this.bird.y + BIRD_DRAW_H / 2 > PLAY_H - 2) {
        this.bird.y = PLAY_H - BIRD_DRAW_H / 2 - 2;
        this.bird.vy = 0;
      }
    }
  }

  _birdHitbox() {
    // slightly tighter than the sprite for fair gameplay
    return { x: this.bird.x - 12, y: this.bird.y - 9, w: 24, h: 18 };
  }

  _collides() {
    const b = this._birdHitbox();
    if (b.y < 0) return true;
    if (b.y + b.h > PLAY_H) return true;

    for (const p of this.pipes) {
      const top = { x: p.x, y: 0, w: PIPE_W, h: p.gapY };
      const bot = {
        x: p.x,
        y: p.gapY + p.gapH,
        w: PIPE_W,
        h: PLAY_H - (p.gapY + p.gapH),
      };
      if (rectsOverlap(b, top) || rectsOverlap(b, bot)) return true;
    }
    return false;
  }

  _die() {
    if (this.state !== State.PLAY) return;
    this.state = State.DEAD;
    this.bird.alive = false;
    this.flash = 1;
    this.deadT = 0;
    this.bird.vy = Math.min(this.bird.vy, 0);
  }

  /* ------------------------------------------------------------ drawing */

  draw() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, W, H);

    this._drawBackdrop();

    if (this.state === State.PLAY || this.state === State.DEAD) this._drawPipes();

    this._drawGround();
    this._drawBird();

    if (this.state === State.PLAY) drawScore(ctx, this.score, W / 2, 40, 4);
    if (this.state === State.TITLE) this._drawTitle();
    if (this.state === State.READY) this._drawReady();
    if (this.state === State.DEAD) this._drawGameOver();

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.85})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  _tile(image, y, offset) {
    const ctx = this.ctx;
    let x = -(offset % image.width);
    if (x > 0) x -= image.width;
    for (; x < W; x += image.width) ctx.drawImage(image, Math.floor(x), y);
  }

  _drawBackdrop() {
    const shift = this.scroll * PIPE_SPEED * 60;
    this._tile(this.clouds, CLOUD_Y, Math.floor(shift * 0.08));
    this._tile(this.city, CITY_Y, Math.floor(shift * 0.16));
    this._tile(this.bushes, BUSH_Y, Math.floor(shift * 0.3));
  }

  _drawPipes() {
    const ctx = this.ctx;
    const bodyX = Math.round((PIPE_CAP_W - PIPE_BODY_W) / 2);
    for (const p of this.pipes) {
      const x = Math.floor(p.x);
      const gapTop = Math.floor(p.gapY);
      const gapBottom = gapTop + p.gapH;

      // top pipe
      const topBodyH = Math.max(0, gapTop - PIPE_CAP_H);
      if (topBodyH > 0) {
        ctx.drawImage(this.pipe.body, x + bodyX, 0, PIPE_BODY_W, topBodyH);
      }
      ctx.drawImage(this.pipe.cap, x, Math.max(-PIPE_CAP_H, gapTop - PIPE_CAP_H));

      // bottom pipe
      const botBodyY = gapBottom + PIPE_CAP_H;
      const botBodyH = Math.max(0, PLAY_H - botBodyY);
      if (botBodyH > 0) {
        ctx.drawImage(this.pipe.body, x + bodyX, botBodyY, PIPE_BODY_W, botBodyH);
      }
      ctx.drawImage(this.pipe.cap, x, gapBottom);
    }
  }

  _drawGround() {
    this._tile(this.ground, PLAY_H, -this.groundX);
  }

  _drawBird() {
    const ctx = this.ctx;
    const frame = this.birdFrames[this.bird.frame];
    ctx.save();
    ctx.translate(Math.round(this.bird.x), Math.round(this.bird.y));
    ctx.rotate(this.bird.rot);
    ctx.drawImage(frame, -BIRD_DRAW_W / 2, -BIRD_DRAW_H / 2, BIRD_DRAW_W, BIRD_DRAW_H);
    ctx.restore();
  }

  _drawTitle() {
    const ctx = this.ctx;
    drawText(ctx, "FLAPPY", W / 2, 96, { scale: 4, fill: COLORS.title });
    drawText(ctx, "CLONE", W / 2, 140, { scale: 4, fill: COLORS.title });
    if (Math.floor(this.scroll * 2) % 2 === 0) {
      drawText(ctx, "TAP TO START", W / 2, 300, { scale: 2 });
    }
    drawText(ctx, `BEST ${this.best}`, W / 2, 336, { scale: 2, fill: COLORS.panelLight });
  }

  _drawReady() {
    const ctx = this.ctx;
    drawScore(ctx, 0, W / 2, 40, 4);
    drawText(ctx, "GET READY", W / 2, 130, { scale: 4, fill: COLORS.title });
    if (Math.floor(this.readyT * 2) % 2 === 0) {
      drawText(ctx, "TAP TO FLAP", W / 2, 300, { scale: 2 });
    }
  }

  _drawGameOver() {
    const ctx = this.ctx;
    drawText(ctx, "GAME OVER", W / 2, 96, { scale: 4, fill: COLORS.gameOver });

    const pw = 216;
    const ph = 108;
    const px = Math.round((W - pw) / 2);
    const py = 150;
    drawPanel(ctx, px, py, pw, ph);

    drawText(ctx, "SCORE", px + pw - 22, py + 18, { scale: 2, align: "right", fill: COLORS.gameOver });
    drawText(ctx, String(this.score), px + pw - 22, py + 36, { scale: 3, align: "right" });
    drawText(ctx, "BEST", px + pw - 22, py + 62, { scale: 2, align: "right", fill: COLORS.gameOver });
    drawText(ctx, String(this.best), px + pw - 22, py + 80, { scale: 3, align: "right" });

    const medal = this._medalFor(this.score);
    if (medal) {
      ctx.drawImage(this.medals[medal], px + 24, py + 34, 40, 40);
    }
    if (this.newBest) {
      drawText(ctx, "NEW!", px + 44, py + 18, { scale: 2, fill: COLORS.gameOver });
    }

    if (this.deadT > 0.55) {
      drawButton(ctx, (W - 96) / 2, 296, 96, 32, "OK");
      if (Math.floor(this.deadT * 2) % 2 === 0) {
        drawText(ctx, "TAP TO RESTART", W / 2, 348, { scale: 2 });
      }
    }
  }

  _medalFor(score) {
    if (score >= 40) return "platinum";
    if (score >= 30) return "gold";
    if (score >= 20) return "silver";
    if (score >= 10) return "bronze";
    return null;
  }
}
