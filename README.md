# Vector Wars

A retro-styled 3D rail shooter built with Three.js, inspired by the 1983 Star Wars arcade aesthetic. Fly through neon vector landscapes, battle enemies with your data lance, and fight through multiple levels of increasing difficulty.

Built with TypeScript, Three.js, and Vite. Runs in the browser or as a standalone desktop app via Electron.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm (included with Node.js)

## Setup

```bash
git clone https://github.com/your-username/vector-wars.git
cd vector-wars
npm install
```

## Running

### Browser (development)

```bash
npm run dev
```

Opens a local dev server (default `http://localhost:5173`). The game runs directly in the browser with hot reload.

### Electron (desktop)

```bash
npm run electron:dev
```

Builds the project and launches it in an Electron window (1280x800).

### Production build

```bash
npm run build
```

Outputs static files to `dist/`. Serve with any static file server or use `npm run preview` to preview locally.

### Electron distributable

```bash
npm run electron:build
```

Produces a standalone executable in `electron-out/` (portable `.exe` on Windows, `.dmg` on macOS).

## Tests

```bash
npm test            # single run
npm run test:watch  # watch mode
```

Tests use Vitest with jsdom.

## Controls

- **Mouse** — aim / move crosshair
- **Left click** — fire data lance
- **Keyboard** — additional weapons and abilities (unlocked during gameplay)

## Tech Stack

- **Three.js** — 3D rendering (vector/wireframe aesthetic)
- **TypeScript** — all game logic
- **Vite** — dev server and bundler
- **Vitest** — unit and integration tests
- **Electron** — optional desktop packaging
