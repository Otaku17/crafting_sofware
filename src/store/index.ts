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

interface AppState {
  // Project
  rootDir: FileSystemDirectoryHandle | null;
  projectName: string;
  projectIconUrl: string | null;
  items: GameItem[];
  csvTexts: Record<number, string>;
  csvLines: string[];
  csvHandle: FileSystemFileHandle | null;
  configHandle: FileSystemFileHandle | null;
  config: CraftingConfig;
  dirty: boolean;
  dirtyKeys: Set<string>;
  currentKey: string | null;

  // UI
  lang: Lang;
  activeTab: TabId;
  theme: 'dark' | 'light';
  toasts: ToastEntry[];

  // Actions
  setLang: (l: Lang) => void;
  setActiveTab: (t: TabId) => void;
  setTheme: (t: 'dark' | 'light') => void;
  openProject: () => Promise<void>;
  saveAll: () => Promise<void>;
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  markDirty: (key?: string | null) => void;

  // Recipes
  setCurrentKey: (key: string | null) => void;
  createRecipe: (item: string, cat: string, qty: number) => Promise<void>;
  deleteRecipe: (key: string) => Promise<void>;
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
  csvTexts: {},
  csvLines: [],
  csvHandle: null,
  configHandle: null,
  config: { categories: [], data: {} },
  dirty: false,
  dirtyKeys: new Set(),
  currentKey: null,
  lang: 'en',
  activeTab: 'recipe',
  theme: (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  toasts: [],

  setLang: (l) => set({ lang: l }),
  setActiveTab: (t) => set({ activeTab: t }),
  setTheme: (t) => {
    localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t);
    set({ theme: t });
  },

  addToast: (message, type = 'ok') => {
    const id = genId();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  markDirty: (key) => {
    set((s) => {
      const next = new Set(s.dirtyKeys);
      if (key) next.add(key);
      return { dirty: true, dirtyKeys: next };
    });
  },

  setCurrentKey: (key) => set({ currentKey: key }),

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
        csvHandle: result.csvHandle,
        csvTexts: result.csvTexts,
        csvLines: result.csvLines,
        dirty: false,
        dirtyKeys: new Set(),
        currentKey: null,
      });

      const s = get();
      const recipeCount = Object.keys(result.config.data).length;
      if (result.warnings.length) {
        get().addToast(`Warnings: ${result.warnings.join(' | ')}`, 'warn');
      } else {
        get().addToast(
          `✅ "${result.projectName}" — ${result.items.length} items, ${recipeCount} recipes`,
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
      set({ dirty: false, dirtyKeys: new Set() });
      get().addToast('✅ crafting_config.json', 'ok');
    } catch (e: any) {
      get().addToast('Save error: ' + e.message, 'err');
    }
  },

  // ── Recipes ──

  createRecipe: async (item, cat, qty) => {
    const s = get();
    let key = item;
    let i = 2;
    while (s.config.data[key]) key = `${item}_${i++}`;

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
    get().addToast(`✅ "${key}"`, 'ok');
  },

  deleteRecipe: async (key) => {
    const s = get();
    const newData = { ...s.config.data };
    delete newData[key];
    const newConfig = { ...s.config, data: newData };

    const newDirty = new Set(s.dirtyKeys);
    newDirty.delete(key);

    set({ config: newConfig, dirtyKeys: newDirty, currentKey: null });

    if (s.configHandle) {
      await writeJsonToHandle(s.configHandle, newConfig);
      set({ dirty: false });
    } else {
      get().markDirty(null);
    }
    get().addToast(`🗑 "${key}"`, 'ok');
  },

  updateRecipeField: (key, field, value) => {
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
    set((s) => {
      const recipe = s.config.data[recipeKey];
      // Deep clone
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

    if (s.csvHandle) {
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

    get().addToast(`✅ "${key}" → CSV[${id}] = "${name}"`, 'ok');
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

  deleteCategory: async (idx) => {
    const s = get();
    const key = Object.keys(s.config.categories[idx])[0];
    const newCats = s.config.categories.filter((_, i) => i !== idx);
    const newConfig = { ...s.config, categories: newCats };
    set({ config: newConfig });

    if (s.configHandle) {
      await writeJsonToHandle(s.configHandle, newConfig);
      set({ dirty: false });
    } else {
      get().markDirty(null);
    }
    get().addToast(`🗑 "${key}"`, 'ok');
  },
}));
