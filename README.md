# Crafting Editor — PSDK

> Recipe editor for [Pokémon Studio](https://github.com/PokemonWorkshop/PokemonStudio). Works as an installable **PWA** — no Electron, no backend, no installation required.

---

## Table of contents

- [Requirements](#requirements)
- [Setup](#setup)
- [Usage](#usage)
- [Why a PWA?](#why-a-pwa)
- [Project structure](#project-structure)
- [Design system](#design-system)
- [Deployment](#deployment)

---

## Requirements

| Tool | Minimum version |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| Browser | Chrome 86+ or Edge 86+ |

> **Firefox and Safari are not supported.** The `showDirectoryPicker` (File System Access API) requires Chrome or Edge.

---

## Setup

```bash
# Clone the repo
git clone https://github.com/Otaku17/Crafting_psdk
cd Crafting_psdk

# Install dependencies
npm install

# Start in development mode
npm run dev        # → http://localhost:1420

# Production build
npm run build      # → dist/

# Preview the PWA build
npm run preview
```

---

## Usage

### 1. Open a project

Click **Open project** in the toolbar and select the **root folder** of your Pokémon Studio project — the one that contains the `.studio` file.

The editor automatically looks for:

| File | Expected path | Role |
|---|---|---|
| `crafting_config.json` | `Data/configs/` | Recipes and categories *(required)* |
| `*.json` items | `Data/Studio/items/` | Available item list |
| `140000.csv` | `Data/Text/Dialogs/` or `Data/Dialogs/` | Category display names |

> If `crafting_config.json` is missing, a splash screen appears with a download link to the latest release.

### 2. Manage recipes

- The **left sidebar** lists all recipes grouped by category
- Click a recipe to edit it
- The **New recipe** button (bottom of the sidebar) opens the creation modal
- `Ctrl+S` saves, `Ctrl+O` opens a project

### 3. Manage categories

- **Manage categories** in the toolbar opens the dedicated tab
- Each category has a key (e.g. `weapons`), a Text ID linked to the CSV, and a translated name
- Adding a category automatically saves both `crafting_config.json` **and** `140000.csv`

### 4. Unlock conditions

Each recipe can have an unlock condition:

| Type | Description |
|---|---|
| `manual` | Always visible (`true`) or always locked (`false`) |
| `switch` | Tied to a game switch (by ID) |
| `variable` | Tied to a variable (ID + comparison value) |
| `recipe` | Unlocked after another recipe (by key) |
| `operator` | Combines multiple conditions (`and` / `or`) |

---

## Why a PWA?

### Installable like a real app

A PWA (Progressive Web App) can be installed directly from the browser — no store, no installer. It opens in its own window without any browser UI, exactly like a native application.

```
Chrome / Edge  →  icon in the address bar  →  "Install Crafting Editor"
```

Once installed, it appears in the Start menu, macOS Dock, or Linux launcher with its own icon.

### Works offline

The service worker (Workbox) caches **all assets** on the first visit. The app loads instantly even without an internet connection. Only opening projects requires access to local files — not the internet.

### Automatic updates

The service worker checks for a new version **every 60 seconds** while the app is open. When an update is available, a banner appears at the bottom of the screen. One click reloads with the latest version — no reinstall needed.

### No system dependencies

No Electron (no ~200 MB embedded Chromium), no Tauri, no runtime to install. The total build size is under **500 KB** (assets included). Works on Windows, macOS and Linux as long as Chrome or Edge is installed.

### Direct file access

Via the **File System Access API**, the editor reads and writes directly into Pokémon Studio project files — `crafting_config.json`, `140000.csv` — with no backend or local server. Changes hit the disk instantly.

---

## Project structure

```
src/
├── components/
│   ├── CategoryManager/   # Categories management tab
│   ├── JsonViewer/        # Raw JSON viewer tab
│   ├── layout/            # Generic components (Button, Badge, StatusBar…)
│   ├── Modal/             # Modals (new recipe, missing files splash)
│   ├── RecipeEditor/      # Main recipe editor panel
│   ├── Sidebar/           # Recipe list + New recipe button
│   ├── TitleBar/          # Title bar (project name, icon, save state)
│   ├── Toast/             # Temporary notifications
│   └── Toolbar/           # Toolbar (Open project, Manage categories)
├── store/
│   └── index.ts           # Global Zustand state (recipes, CSV, UI)
├── styles/
│   └── globals.css        # Global CSS tokens + reset + mobile block
├── types/
│   └── index.ts           # TypeScript types (Recipe, Category, Condition…)
├── utils/
│   ├── fileSystem.ts      # File read/write (File System Access API)
│   └── i18n.ts            # EN / FR translations
├── App.tsx                # Root composition + keyboard shortcuts
└── main.tsx               # React entry point + PWA registration
```

---

## Design system

All visual tokens are declared in `src/styles/globals.css` as CSS custom properties. **No `.module.css` file uses raw values** — only `var(--token)`.

### Surfaces (darkest to lightest)

| Token | Usage |
|---|---|
| `--bg-base` | Main background |
| `--bg-elevated` | Sidebar, header |
| `--bg-surface` | Cards, inputs |
| `--bg-overlay` | Hover, raised |
| `--bg-raised` | Active, selected |

### Colors

| Token | Value | Usage |
|---|---|---|
| `--accent` | `#6B72F0` | Primary actions, focus |
| `--green` | `#34D399` | Success |
| `--red` | `#F87171` | Errors, deletions |
| `--yellow` | `#FBBF24` | Warnings, unsaved state |
| `--cyan` | `#22D3EE` | Info |

### Typography

| Token | Font |
|---|---|
| `--font-ui` | Plus Jakarta Sans |
| `--font-mono` | JetBrains Mono |

---

## Deployment

Any static file host works. For GitHub Pages, the CI/CD workflow is already set up in `.github/workflows/deploy.yml`.

```bash
npm run build
# Upload the contents of dist/ to your host
```

The `VITE_BASE` environment variable must match your deployment sub-path:

```bash
# Example for GitHub Pages at /Crafting_psdk/
VITE_BASE=/Crafting_psdk/ npm run build
```

> The service worker requires **HTTPS** in production. `localhost` works in development without HTTPS.
