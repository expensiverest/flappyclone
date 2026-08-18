# Flappy Clone

A browser Flappy Bird–style clone inspired by the reference screenshots in this repo.

## Play

Open `index.html` in a modern browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

### Controls

- **Click / tap / space / ↑** — flap
- After game over, tap again (or press **R**) to restart

## Project layout

- `index.html` — game shell
- `css/style.css` — page layout and pixel scaling
- `js/main.js` — entrypoint
- `js/game.js` — gameplay loop, physics, states
- `js/sprites.js` — procedural pixel sprites (bird, pipes, ground, city)

## CI

GitHub Actions workflow `.github/workflows/ci.yml` validates that required files exist and that the JavaScript parses cleanly.

## Note on reference images

`IMG_2213.jpeg`–`IMG_2216.jpeg` are private-repo reference screenshots. Tooling that re-hosts those files for vision models may 404; the game uses procedural sprites matched to the classic palette instead of embedding those JPEGs at runtime.
