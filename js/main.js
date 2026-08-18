import { Game } from "./game.js";

const canvas = document.getElementById("game");
if (!canvas) {
  throw new Error("Missing #game canvas");
}

// Keep internal resolution fixed for pixel look; CSS scales it.
canvas.width = 288;
canvas.height = 512;

new Game(canvas);
