# Flappy Clone

A browser Flappy Bird–style clone inspired by the reference screenshots in this repo.

## Play

### GitHub Pages (phone-friendly)

After this repo’s Pages deploy workflow runs on `main`, open:

**https://expensiverest.github.io/flappyclone/**

One-time setup (repo admin):

1. **Settings → Pages → Build and deployment → Source:** GitHub Actions
2. Merge to `main` (or run **Actions → Deploy GitHub Pages → Run workflow**)
3. Wait for the deploy job, then open the URL above on your iPhone

If the repo is private, GitHub Pages requires a plan that includes private Pages.

### Local

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
- `flappy-clone.html` — single-file build (also published on Pages)
- `css/style.css` — page layout and pixel scaling
- `js/main.js` — entrypoint
- `js/game.js` — gameplay loop, physics, states
- `js/sprites.js` — procedural pixel sprites (bird, pipes, ground, city)

## CI / deploy

- `.github/workflows/ci.yml` — validates required files and JS syntax
- `.github/workflows/deploy-pages.yml` — publishes the static game to GitHub Pages on pushes to `main`

## Note on reference images

`IMG_2213.jpeg`–`IMG_2216.jpeg` are private-repo reference screenshots. Tooling that re-hosts those files for vision models may 404; the game uses procedural sprites matched to the classic palette instead of embedding those JPEGs at runtime.
