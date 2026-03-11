# Crafting Editor — PSDK (PWA)

React + TypeScript + Vite + PWA — no Electron, no Tauri, no backend.

## Stack

- **React 18** + **TypeScript**
- **Zustand** — global state
- **CSS Modules** — scoped styles, all tokens in `:root`
- **Vite** + **vite-plugin-pwa** (Workbox) — service worker, offline, installable

## Setup

```bash
npm install
npm run dev       # http://localhost:1420
npm run build     # outputs dist/
npm run preview   # preview built PWA
```

## Deploy

Any static host works — Vercel, Netlify, GitHub Pages, nginx:

```bash
npm run build
# upload dist/ to your host
```

The service worker caches all assets so the app works **fully offline** after
the first visit. Because the File System Access API requires a secure context,
you must serve over **HTTPS** in production (localhost is fine for dev).

## Install as desktop app

1. Open in Chrome or Edge
2. Click the **⬇ Install app** button in the status bar  
   — or use the browser's address bar install icon
3. The app opens in its own window, no browser UI

## Browser requirements

The File System Access API (`showDirectoryPicker`) is required to read/write
project files. Supported in **Chrome 86+** and **Edge 86+**.
Firefox and Safari do not support it yet.

## CSS Design System

All design tokens live in `src/styles/globals.css` as CSS custom properties.
Every `*.module.css` file only references `var(--token)` — never raw values.

| Token | Value |
|---|---|
| `--bg-base` | `#080a0f` |
| `--accent` | `#5b6af0` |
| `--font-mono` | JetBrains Mono |
| `--font-display` | Syne |
