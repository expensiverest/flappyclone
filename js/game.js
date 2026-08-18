import {
  COLORS,
  createBirdFrames,
  createPipeSprite,
  createGroundPattern,
  createCityscape,
  drawScore,
  drawOutlinedText,
} from "./sprites.js";

const W = 288;
const H = 512;
const GROUND_H = 112;
const PLAY_H = H - GROUND_H;
const BIRD_X = 64;
const GRAVITY = 0.42;
const FLAP = -6.8;
const PIPE_W = 52;
const PIPE_GAP = 118;
const PIPE_SPEED = 2.15;
const PIPE_SPACING = 168;
const BIRD_W = 34;
const BIRD_H = 24;

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
    this.groundPat = createGroundPattern();
    this.city = createCityscape(W * 2, 72);
    this.pipeCache = new Map();

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
    this.scroll = 0;
    this.groundX = 0;
    this.flash = 0;
    this.deadT = 0;
    this.readyT = 0;
    this.spawnX = W + 20;
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

  getPipeSprite(height, isTop) {
    const key = `${isTop ? "t" : "b"}:${height}`;
    if (!this.pipeCache.has(key)) {
      this.pipeCache.set(key, createPipeSprite(height, isTop));
    }
    return this.pipeCache.get(key);
  }

  _ensurePipes() {
    while (this.pipes.length < 4) {
      const last = this.pipes[this.pipes.length - 1];
      const x = last ? last.x + PIPE_SPACING : this.spawnX;
      this.pipes.push(this._makePipe(x));
    }
  }

  _makePipe(x) {
    const margin = 36;
    const gapY = margin + Math.random() * (PLAY_H - PIPE_GAP - margin * 2);
    return {
      x,
      gapY,
      gapH: PIPE_GAP,
      scored: false,
    };
  }

  loop(t) {
    const dt = Math.min(0.033, (t - this.last) / 1000);
    this.last = t;
    this.update(dt);
    this.draw();
    requestAnimationFrame((nt) => this.loop(nt));
  }

  update(dt) {
    const moving =
      this.state === State.PLAY || this.state === State.TITLE || this.state === State.READY;

    if (moving && (this.state !== State.DEAD)) {
      this.groundX = (this.groundX - PIPE_SPEED * (this.state === State.PLAY ? 1 : 0.7)) % 24;
      this.scroll += dt;
    }

    // idle bob on title/ready
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
      if (this.bird.y + BIRD_H / 2 > PLAY_H - 2) {
        this.bird.y = PLAY_H - BIRD_H / 2 - 2;
        this.bird.vy = 0;
      }
    }
  }

  _birdHitbox() {
    // tighter than sprite for fair gameplay
    return {
      x: this.bird.x - 10,
      y: this.bird.y - 8,
      w: 20,
      h: 16,
    };
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

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);

    // sky
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, W, H);

    // soft vertical tint
    const g = ctx.createLinearGradient(0, 0, 0, PLAY_H);
    g.addColorStop(0, "rgba(255,255,255,0.08)");
    g.addColorStop(1, "rgba(0,0,0,0.04)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, PLAY_H);

    // city parallax
    const cityY = PLAY_H - this.city.height + 4;
    const cx = -((this.scroll * 12) % W);
    ctx.globalAlpha = 0.55;
    ctx.drawImage(this.city, cx, cityY);
    ctx.drawImage(this.city, cx + W, cityY);
    ctx.globalAlpha = 1;

    // pipes
    if (this.state === State.PLAY || this.state === State.DEAD) {
      for (const p of this.pipes) {
        const topH = Math.max(1, Math.floor(p.gapY));
        const botY = Math.floor(p.gapY + p.gapH);
        const botH = Math.max(1, PLAY_H - botY);
        const top = this.getPipeSprite(topH, true);
        const bot = this.getPipeSprite(botH, false);
        ctx.drawImage(top, Math.floor(p.x), 0, PIPE_W, topH);
        ctx.drawImage(bot, Math.floor(p.x), botY, PIPE_W, botH);
      }
    }

    // ground
    this._drawGround();

    // bird
    this._drawBird();

    // HUD
    if (this.state === State.PLAY) {
      drawScore(ctx, this.score, W / 2, 56);
    }

    if (this.state === State.TITLE) this._drawTitle();
    if (this.state === State.READY) this._drawReady();
    if (this.state === State.DEAD) this._drawGameOver();

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.85})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  _drawGround() {
    const ctx = this.ctx;
    // dirt body
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, PLAY_H, W, GROUND_H);
    // scrolling grass strip
    const y = PLAY_H;
    for (let x = Math.floor(this.groundX); x < W + 24; x += 24) {
      ctx.drawImage(this.groundPat, x, y);
    }
    // top outline
    ctx.fillStyle = COLORS.outline;
    ctx.fillRect(0, PLAY_H, W, 2);
  }

  _drawBird() {
    const ctx = this.ctx;
    const frame = this.birdFrames[this.bird.frame];
    ctx.save();
    ctx.translate(this.bird.x, this.bird.y);
    ctx.rotate(this.bird.rot);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(frame, -BIRD_W / 2, -BIRD_H / 2, BIRD_W, BIRD_H);
    ctx.restore();
  }

  _drawTitle() {
    const ctx = this.ctx;
    drawOutlinedText(ctx, "FLAPPY", W / 2, 120, 36, "#f5e642");
    drawOutlinedText(ctx, "CLONE", W / 2, 158, 36, "#f5e642");
    drawOutlinedText(ctx, "TAP TO START", W / 2, 250, 16, "#fff");
    // decorative pipes on sides for title flavor
  }

  _drawReady() {
    const ctx = this.ctx;
    drawOutlinedText(ctx, "GET READY", W / 2, 140, 28, "#f5e642");
    drawScore(ctx, 0, W / 2, 56);
    // instruction hand-ish
    drawOutlinedText(ctx, "TAP", W / 2, 290, 18, "#fff");
    const pulse = 0.5 + 0.5 * Math.sin(this.readyT * 6);
    ctx.save();
    ctx.globalAlpha = 0.55 + pulse * 0.45;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(W / 2, 330, 16 + pulse * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _drawGameOver() {
    const ctx = this.ctx;
    drawOutlinedText(ctx, "GAME OVER", W / 2, 120, 30, "#f25a2a");

    // score panel
    const pw = 210;
    const ph = 118;
    const px = (W - pw) / 2;
    const py = 155;
    ctx.fillStyle = COLORS.outline;
    ctx.fillRect(px - 3, py - 3, pw + 6, ph + 6);
    ctx.fillStyle = COLORS.panel;
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = COLORS.panelDark;
    ctx.fillRect(px, py + ph - 10, pw, 10);

    ctx.fillStyle = "#e86100";
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = "left";
    ctx.fillText("MEDAL", px + 16, py + 28);
    ctx.fillText("SCORE", px + 120, py + 28);
    ctx.fillText("BEST", px + 120, py + 78);

    drawScore(ctx, this.score, px + 160, py + 58, 0.7);
    drawScore(ctx, this.best, px + 160, py + 108, 0.7);

    // medal
    const medal = this._medalFor(this.score);
    if (medal) {
      ctx.beginPath();
      ctx.fillStyle = COLORS.outline;
      ctx.arc(px + 52, py + 70, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = medal;
      ctx.arc(px + 52, py + 70, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.arc(px + 45, py + 62, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.deadT > 0.55) {
      // restart button
      const bw = 110;
      const bh = 36;
      const bx = (W - bw) / 2;
      const by = 300;
      ctx.fillStyle = COLORS.outline;
      ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
      ctx.fillStyle = COLORS.button;
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = COLORS.buttonDark;
      ctx.fillRect(bx, by + bh - 6, bw, 6);
      drawOutlinedText(ctx, "OK", W / 2, by + 26, 20, "#fff");
      drawOutlinedText(ctx, "TAP TO RESTART", W / 2, 360, 14, "#fff");
    }
  }

  _medalFor(score) {
    if (score >= 40) return COLORS.medalPlatinum;
    if (score >= 30) return COLORS.medalGold;
    if (score >= 20) return COLORS.medalSilver;
    if (score >= 10) return COLORS.medalBronze;
    return null;
  }
}
