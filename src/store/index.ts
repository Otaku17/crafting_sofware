import { create } from 'zustand';
import type {
  CraftingConfig, GameItem, Lang, TabId, ToastEntry, ToastType, Condition, Recipe, Category,
} from '../types';
import {
  writeJsonToHandle, writeCsvToHandle, parseCsvText, loadProjectFiles,
} from '../utils/fileSystem';

function genId() {
  return Math.random().toString(36).slice(2);
}

// Simple CSV line parser that handles quoted fields
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

interface AppState {
  // Project
  rootDir: FileSystemDirectoryHandle | null;
  projectName: string;
  projectIconUrl: string | null;
  items: GameItem[];
  itemIcons: Record<string, string>;
  csvTexts: Record<number, string>;
  csvLines: string[];
  csvSnapshot: string[] | null;  // lines before any pending edits
  csvDirty: boolean;
  csvHandle: FileSystemFileHandle | null;
  configHandle: FileSystemFileHandle | null;
  config: CraftingConfig;
  dirty: boolean;
  dirtyKeys: Set<string>;
  /** Snapshot of each recipe taken at the moment it first became dirty */
  snapshots: Record<string, Recipe>;
  currentKey: string | null;

  // UI
  lang: Lang;
  activeTab: TabId;
  theme: 'dark' | 'light';
  toasts: ToastEntry[];
  missingFilesWarnings: string[];
  missingFilesOpen: boolean;

  // Actions
  setLang: (l: Lang) => void;
  setActiveTab: (t: TabId) => void;
  setTheme: (t: 'dark' | 'light') => void;
  openProject: () => Promise<void>;
  saveAll: () => Promise<void>;
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  markDirty: (key?: string | null) => void;
  snapshotIfClean: (key: string) => void;
  closeMissingFiles: () => void;

  // Recipes
  setCurrentKey: (key: string | null) => void;
  createRecipe: (item: string, cat: string, qty: number) => Promise<void>;
  deleteRecipe: (key: string) => Promise<void>;
  renameRecipe: (oldKey: string, newKey: string) => void;
  discardRecipe: (key: string) => void;
  updateRecipeField: <K extends keyof Recipe>(key: string, field: K, value: Recipe[K]) => void;
  updateIngredient: (recipeKey: string, oldItem: string, newItem: string | null, qty: number | null) => void;
  addIngredient: (recipeKey: string) => void;
  deleteIngredient: (recipeKey: string, item: string) => void;
  setRootCondition: (recipeKey: string, type: string) => void;
  updateConditionByPath: (recipeKey: string, path: string, field: string, value: unknown) => void;
  addChildCondition: (recipeKey: string, path: string, type: string) => void;
  removeChildCondition: (recipeKey: string, path: string, idx: number) => void;

  // Categories
  addCategory: (key: string, id: number, name: string) => Promise<void>;
  updateCategoryId: (idx: number, val: number) => void;
  updateCategoryTranslation: (lineIdx: number, colIdx: number, value: string) => void;
  saveCsv: () => Promise<void>;
  discardCsv: () => void;
  deleteCategory: (idx: number) => Promise<void>;
}

function getCondByPath(root: Condition, path: string): Condition {
  const parts = path.split('.').slice(1);
  let node = root;
  for (const p of parts) {
    node = (node as any).conditions[parseInt(p)];
  }
  return node;
}

export const useStore = create<AppState>((set, get) => ({
  rootDir: null,
  projectName: '',
  projectIconUrl: null,
  items: [],
  itemIcons: {},
  csvTexts: {},
  csvLines: [],
  csvSnapshot: null,
  csvDirty: false,
  csvHandle: null,
  configHandle: null,
  config: { categories: [], data: {} },
  dirty: false,
  dirtyKeys: new Set(),
  snapshots: {},
  currentKey: null,
  lang: 'en',
  activeTab: 'recipe',
  theme: (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  toasts: [],
  missingFilesWarnings: [],
  missingFilesOpen: false,

  setLang: (l) => set({ lang: l }),
  setActiveTab: (t) => set({ activeTab: t }),
  setTheme: (t) => {
    localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t);
    set({ theme: t });
  },
  closeMissingFiles: () => set({ missingFilesOpen: false }),

  addToast: (message, type = 'ok') => {
    const id = genId();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  markDirty: (key) => {
    set((s) => {
      const nextKeys = new Set(s.dirtyKeys);
      if (key) nextKeys.add(key);
      return { dirty: true, dirtyKeys: nextKeys };
    });
  },

  setCurrentKey: (key) => set({ currentKey: key }),

  // ── Snapshot helper — call BEFORE mutating, only first time ─────────────
  // Not exposed on interface, used internally via get()
  snapshotIfClean: (key) => {
    const s = get();
    if (!s.dirtyKeys.has(key) && s.config.data[key]) {
      set((st) => ({
        snapshots: {
          ...st.snapshots,
          [key]: JSON.parse(JSON.stringify(st.config.data[key])),
        },
      }));
    }
  },

  discardRecipe: (key) => {
    set((s) => {
      const snap = s.snapshots[key];
      if (!snap) return {}; // nothing to restore

      const nextData = { ...s.config.data, [key]: JSON.parse(JSON.stringify(snap)) };
      const nextDirtyKeys = new Set(s.dirtyKeys);
      nextDirtyKeys.delete(key);
      const nextSnaps = { ...s.snapshots };
      delete nextSnaps[key];

      return {
        config: { ...s.config, data: nextData },
        dirtyKeys: nextDirtyKeys,
        snapshots: nextSnaps,
        dirty: nextDirtyKeys.size > 0,
      };
    });
    get().addToast(`"${key}" reverted`, 'info');
  },

  openProject: async () => {
    if (!window.showDirectoryPicker) {
      get().addToast('File System API not supported. Use Chrome or Edge.', 'err');
      return;
    }
    let rootDir: FileSystemDirectoryHandle;
    try {
      rootDir = await window.showDirectoryPicker({ mode: 'readwrite' });
    } catch (e: any) {
      if (e.name !== 'AbortError') get().addToast('Error: ' + e.message, 'err');
      return;
    }

    get().addToast('Loading...', 'info');
    try {
      const result = await loadProjectFiles(rootDir);
      set({
        rootDir,
        projectName: result.projectName,
        projectIconUrl: result.projectIconUrl,
        config: result.config,
        configHandle: result.configHandle,
        items: result.items,
        itemIcons: result.itemIcons,
        csvHandle: result.csvHandle,
        csvTexts: result.csvTexts,
        csvLines: result.csvLines,
        csvDirty: false,
        csvSnapshot: null,
        dirty: false,
        dirtyKeys: new Set(),
        snapshots: {},
        currentKey: null,
      });

      const recipeCount = Object.keys(result.config.data).length;
      if (result.warnings.length) {
        set({ missingFilesWarnings: result.warnings, missingFilesOpen: true });
      } else {
        get().addToast(
          `"${result.projectName}" — ${result.items.length} items, ${recipeCount} recipes`,
          'ok',
        );
      }
    } catch (e: any) {
      get().addToast('Load error: ' + e.message, 'err');
    }
  },

  saveAll: async () => {
    const s = get();
    if (!s.configHandle) { get().addToast('No project', 'err'); return; }
    try {
      await writeJsonToHandle(s.configHandle, s.config);
      set({ dirty: false, dirtyKeys: new Set(), snapshots: {} });
      get().addToast('crafting_config.json saved', 'ok');
    } catch (e: any) {
      get().addToast('Save error: ' + e.message, 'err');
    }
  },

  // ── Recipes ──

  createRecipe: async (item, cat, qty) => {
    const s = get();
    const key = item;

    if (s.config.data[key]) {
      get().addToast(`A recipe for "${key}" already exists`, 'err');
      return;
    }

    const newConfig: CraftingConfig = {
      ...s.config,
      data: {
        ...s.config.data,
        [key]: {
          ingredients: {},
          result: item,
          quantity: qty,
          category: cat || 'all',
          unlock_condition: { type: 'manual', value: true },
        },
      },
    };

    set({ config: newConfig });

    if (s.configHandle) {
      await writeJsonToHandle(s.configHandle, newConfig);
      set({ dirty: false });
    } else {
      get().markDirty(key);
    }

    set({ currentKey: key, activeTab: 'recipe' });
    get().addToast(`"${key}" created`, 'ok');
  },

  deleteRecipe: async (key) => {
    const s = get();
    const newData = { ...s.config.data };
    delete newData[key];
    const newConfig = { ...s.config, data: newData };

    const newDirty = new Set(s.dirtyKeys);
    newDirty.delete(key);
    const newSnaps = { ...s.snapshots };
    delete newSnaps[key];

    set({ config: newConfig, dirtyKeys: newDirty, snapshots: newSnaps, currentKey: null });

    if (s.configHandle) {
      await writeJsonToHandle(s.configHandle, newConfig);
      set({ dirty: false });
    } else {
      get().markDirty(null);
    }
    get().addToast(`"${key}" deleted`, 'ok');
  },

  renameRecipe: (oldKey, newKey) => {
    if (oldKey === newKey) return;
    const s = get();
    if (!s.config.data[oldKey]) return;

    // Refuse if target key already exists
    if (s.config.data[newKey]) {
      get().addToast(`"${newKey}" already exists`, 'err');
      return;
    }

    // Preserve insertion order: rebuild data object with key replaced in place
    const newData: typeof s.config.data = {};
    for (const k of Object.keys(s.config.data)) {
      if (k === oldKey) newData[newKey] = { ...s.config.data[k], result: newKey };
      else newData[k] = s.config.data[k];
    }

    // Migrate dirty/snapshot state from old key to new key
    const newDirtyKeys = new Set(s.dirtyKeys);
    const newSnaps = { ...s.snapshots };
    if (newDirtyKeys.has(oldKey)) {
      newDirtyKeys.delete(oldKey);
      newDirtyKeys.add(newKey);
    }
    if (newSnaps[oldKey]) {
      newSnaps[newKey] = newSnaps[oldKey];
      delete newSnaps[oldKey];
    }

    // Always mark the renamed recipe as dirty (key change = unsaved)
    if (!newDirtyKeys.has(newKey) && s.config.data[oldKey]) {
      newSnaps[newKey] = JSON.parse(JSON.stringify(s.config.data[oldKey]));
      newDirtyKeys.add(newKey);
    }

    set({
      config: { ...s.config, data: newData },
      currentKey: newKey,
      dirtyKeys: newDirtyKeys,
      snapshots: newSnaps,
      dirty: true,
    });
  },

  updateRecipeField: (key, field, value) => {
    get().snapshotIfClean(key);
    set((s) => ({
      config: {
        ...s.config,
        data: { ...s.config.data, [key]: { ...s.config.data[key], [field]: value } },
      },
    }));
    get().markDirty(key);
  },

  addIngredient: (recipeKey) => {
    const s = get();
    const ingr = { ...(s.config.data[recipeKey].ingredients || {}) };
    let k = 'new_item';
    let i = 1;
    while (ingr[k]) k = `new_item_${i++}`;
    ingr[k] = 1;
    get().updateRecipeField(recipeKey, 'ingredients', ingr);
  },

  deleteIngredient: (recipeKey, item) => {
    const s = get();
    const ingr = { ...(s.config.data[recipeKey].ingredients || {}) };
    delete ingr[item];
    get().updateRecipeField(recipeKey, 'ingredients', ingr);
  },

  updateIngredient: (recipeKey, oldItem, newItem, qty) => {
    const s = get();
    const ingr = { ...(s.config.data[recipeKey].ingredients || {}) };
    if (newItem !== null && newItem !== oldItem) {
      const v = ingr[oldItem];
      delete ingr[oldItem];
      ingr[newItem] = v;
    }
    const finalKey = newItem ?? oldItem;
    if (qty !== null) ingr[finalKey] = qty;
    get().updateRecipeField(recipeKey, 'ingredients', ingr);
  },

  setRootCondition: (recipeKey, type) => {
    const defaults: Record<string, Condition> = {
      manual:   { type: 'manual', value: true },
      switch:   { type: 'switch', id: 0 },
      variable: { type: 'variable', id: 0, value: 0 },
      recipe:   { type: 'recipe', key: '' },
      operator: { operator: 'and', conditions: [] },
    };
    get().updateRecipeField(recipeKey, 'unlock_condition', defaults[type]);
  },

  updateConditionByPath: (recipeKey, path, field, value) => {
    get().snapshotIfClean(recipeKey);
    set((s) => {
      const recipe = s.config.data[recipeKey];
      const cond: Condition = JSON.parse(JSON.stringify(recipe.unlock_condition));
      const node = getCondByPath(cond, path) as any;
      node[field] = value;
      return {
        config: {
          ...s.config,
          data: { ...s.config.data, [recipeKey]: { ...recipe, unlock_condition: cond } },
        },
      };
    });
    get().markDirty(recipeKey);
  },

  addChildCondition: (recipeKey, path, type) => {
    get().snapshotIfClean(recipeKey);
    const defaults: Record<string, Condition> = {
      manual:   { type: 'manual', value: true },
      switch:   { type: 'switch', id: 0 },
      variable: { type: 'variable', id: 0, value: 0 },
      recipe:   { type: 'recipe', key: '' },
    };
    set((s) => {
      const recipe = s.config.data[recipeKey];
      const cond: Condition = JSON.parse(JSON.stringify(recipe.unlock_condition));
      const node = getCondByPath(cond, path) as any;
      if (!node.conditions) node.conditions = [];
      node.conditions.push(defaults[type]);
      return {
        config: { ...s.config, data: { ...s.config.data, [recipeKey]: { ...recipe, unlock_condition: cond } } },
      };
    });
    get().markDirty(recipeKey);
  },

  removeChildCondition: (recipeKey, path, idx) => {
    get().snapshotIfClean(recipeKey);
    set((s) => {
      const recipe = s.config.data[recipeKey];
      const cond: Condition = JSON.parse(JSON.stringify(recipe.unlock_condition));
      const node = getCondByPath(cond, path) as any;
      node.conditions.splice(idx, 1);
      return {
        config: { ...s.config, data: { ...s.config.data, [recipeKey]: { ...recipe, unlock_condition: cond } } },
      };
    });
    get().markDirty(recipeKey);
  },

  // ── Categories ──

  addCategory: async (key, id, name) => {
    const s = get();
    if (s.config.categories.find((c) => Object.keys(c)[0] === key)) {
      get().addToast('Category already exists', 'err');
      return;
    }

    const newCategories: Category[] = [...s.config.categories, { [key]: id }];
    const newConfig = { ...s.config, categories: newCategories };

    let newCsvLines = [...s.csvLines];
    let newCsvTexts = { ...s.csvTexts };

    if (s.csvHandle && name) {
      while (newCsvLines.length <= id) newCsvLines.push('');
      newCsvLines[id] = name;
      const parsed = parseCsvText(newCsvLines.join('\n'));
      newCsvTexts = parsed.texts;
      newCsvLines = parsed.lines;
      try {
        await writeCsvToHandle(s.csvHandle, newCsvLines);
      } catch (e: any) {
        get().addToast('CSV write error: ' + e.message, 'warn');
      }
    }

    set({ config: newConfig, csvLines: newCsvLines, csvTexts: newCsvTexts });

    if (s.configHandle) {
      await writeJsonToHandle(s.configHandle, newConfig);
      set({ dirty: false });
    } else {
      get().markDirty(null);
    }

    get().addToast(`"${key}" added → CSV[${id}] = "${name}"`, 'ok');
  },

  updateCategoryId: (idx, val) => {
    set((s) => {
      const cats = [...s.config.categories];
      const key = Object.keys(cats[idx])[0];
      cats[idx] = { [key]: val };
      return { config: { ...s.config, categories: cats } };
    });
    get().markDirty(null);
  },

  updateCategoryTranslation: (lineIdx, colIdx, value) => {
    set((s) => {
      const lines = [...s.csvLines];
      // Snapshot before first edit
      const snapshot = s.csvSnapshot ?? [...s.csvLines];
      // Parse existing columns
      const cols = parseCsvLine(lines[lineIdx] || '');
      while (cols.length <= colIdx) cols.push('');
      cols[colIdx] = value;
      lines[lineIdx] = cols.map((c) => (c.includes(',') ? `"${c}"` : c)).join(',');
      const { texts, lines: newLines } = parseCsvText(lines.join('\n'));
      return { csvLines: newLines, csvTexts: texts, csvSnapshot: snapshot, csvDirty: true };
    });
  },

  saveCsv: async () => {
    const s = get();
    if (!s.csvHandle) { get().addToast('No CSV file loaded', 'warn'); return; }
    try {
      await writeCsvToHandle(s.csvHandle, s.csvLines);
      set({ csvDirty: false, csvSnapshot: null });
      get().addToast('CSV saved', 'ok');
    } catch (e: any) {
      get().addToast('CSV write error: ' + e.message, 'err');
    }
  },

  discardCsv: () => {
    set((s) => {
      if (!s.csvSnapshot) return {};
      const { texts, lines } = parseCsvText(s.csvSnapshot.join('\n'));
      return { csvLines: lines, csvTexts: texts, csvSnapshot: null, csvDirty: false };
    });
    get().addToast('CSV changes discarded', 'info');
  },

  deleteCategory: async (idx) => {
    const s = get();
    const key = Object.keys(s.config.categories[idx])[0];
    const newCats = s.config.categories.filter((_, i) => i !== idx);

    // Recipes using this category lose their category (will appear uncategorized)
    const newData = { ...s.config.data };
    let migrated = 0;
    for (const [rk, recipe] of Object.entries(newData)) {
      if (recipe.category === key) {
        const { category: _, ...rest } = recipe;
        newData[rk] = rest as typeof recipe;
        migrated++;
      }
    }

    const newConfig = { ...s.config, categories: newCats, data: newData };
    set({ config: newConfig });

    if (s.configHandle) {
      await writeJsonToHandle(s.configHandle, newConfig);
      set({ dirty: false });
    } else {
      get().markDirty(null);
    }
    const hint = migrated > 0 ? ` (${migrated} recipe${migrated > 1 ? 's' : ''} uncategorized)` : '';
    get().addToast(`"${key}" deleted${hint}`, 'ok');
  },
}));
