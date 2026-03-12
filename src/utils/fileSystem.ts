import type { CraftingConfig, GameItem } from '../types';

declare global {
  interface Window {
    showDirectoryPicker?: (opts?: {
      mode?: string;
    }) => Promise<FileSystemDirectoryHandle>;
  }
}

export const hasFileSystemAPI = (): boolean => !!window.showDirectoryPicker;

async function traverseDir(
  parent: FileSystemDirectoryHandle,
  ...parts: string[]
): Promise<FileSystemDirectoryHandle> {
  let dir = parent;
  for (const p of parts) dir = await dir.getDirectoryHandle(p);
  return dir;
}

export interface ProjectFiles {
  projectName: string;
  projectIconUrl: string | null;
  config: CraftingConfig;
  configHandle: FileSystemFileHandle;
  items: GameItem[];
  itemIcons: Record<string, string>;   // dbSymbol → object URL
  csvHandle: FileSystemFileHandle | null;
  csvTexts: Record<number, string>;
  csvLines: string[];
  warnings: string[];
}

export async function loadProjectFiles(
  rootDir: FileSystemDirectoryHandle,
): Promise<ProjectFiles> {
  const warnings: string[] = [];
  let projectName = rootDir.name;
  let projectIconUrl: string | null = null;
  let configHandle: FileSystemFileHandle | null = null;
  let config: CraftingConfig = { categories: [], data: {} };
  let items: GameItem[] = [];
  let itemIcons: Record<string, string> = {};
  let csvHandle: FileSystemFileHandle | null = null;
  let csvTexts: Record<number, string> = {};
  let csvLines: string[] = [];

  // .studio
  try {
    for await (const [name, handle] of (rootDir as any).entries()) {
      if (name.endsWith('.studio') && handle.kind === 'file') {
        const raw = await (await handle.getFile()).text();
        const data = JSON.parse(raw);
        projectName = data.title || name.replace('.studio', '');
        break;
      }
    }
  } catch (e: any) {
    warnings.push(`.studio: ${e.message}`);
  }

  // project_icon — try common extensions, then scan root entries
  try {
    let iconFile: File | null = null;
    // Direct attempts for common extensions
    for (const ext of [
      'png',
      'PNG',
      'jpg',
      'JPG',
      'jpeg',
      'JPEG',
      'gif',
      'webp',
    ]) {
      try {
        const h = await rootDir.getFileHandle(`project_icon.${ext}`);
        iconFile = await h.getFile();
        break;
      } catch {
        /* try next */
      }
    }
    // Fallback: iterate root entries
    if (!iconFile) {
      for await (const [name, handle] of (rootDir as any).entries()) {
        if (handle.kind === 'file' && /^project_icon\./i.test(name)) {
          iconFile = await (handle as FileSystemFileHandle).getFile();
          break;
        }
      }
    }
    if (iconFile) {
      projectIconUrl = URL.createObjectURL(iconFile);
    }
  } catch {
    // no icon — fine
  }

  // crafting_config.json
  try {
    const dir = await traverseDir(rootDir, 'Data', 'configs');
    try {
      configHandle = await dir.getFileHandle('crafting_config.json');
    } catch {
      configHandle = await dir.getFileHandle('crafting_config.json', {
        create: true,
      });
      await writeJsonToHandle(configHandle, config);
    }
    const raw = (await (await configHandle.getFile()).text()).trim();
    if (raw) {
      const parsed = JSON.parse(raw);
      config = {
        categories: parsed.categories ?? [],
        data: parsed.data ?? {},
      };
    }
  } catch (e: any) {
    warnings.push(`crafting_config: ${e.message}`);
  }

  // items
  try {
    const dir = await traverseDir(rootDir, 'Data', 'Studio', 'items');
    for await (const [name, handle] of (dir as any).entries()) {
      if (name.endsWith('.json') && handle.kind === 'file') {
        try {
          const d = JSON.parse(
            await (await (handle as FileSystemFileHandle).getFile()).text(),
          );
          if (d.dbSymbol) items.push(d);
          else if (Array.isArray(d))
            d.forEach((x: GameItem) => x.dbSymbol && items.push(x));
        } catch {}
      }
    }
    items.sort((a, b) => a.dbSymbol.localeCompare(b.dbSymbol));
  } catch (e: any) {
    warnings.push(`items: ${e.message}`);
  }

  // item icons — graphics/icons/<icon>.png, fallback to return.png
  try {
    const iconsDir = await traverseDir(rootDir, 'graphics', 'icons');

    // Helper: load one icon file → object URL, or null if not found
    async function loadIcon(filename: string): Promise<string | null> {
      try {
        const h = await iconsDir.getFileHandle(filename);
        return URL.createObjectURL(await h.getFile());
      } catch {
        return null;
      }
    }

    // Fallback URL — loaded once
    const fallbackUrl = await loadIcon('return.png');

    for (const item of items) {
      const iconFile = item.icon ? `${item.icon}.png` : null;
      const url = iconFile ? await loadIcon(iconFile) : null;
      itemIcons[item.dbSymbol] = url ?? fallbackUrl ?? '';
    }
  } catch {
    // graphics/icons folder not found — icons will be empty strings
  }

  // CSV
  const csvPaths: string[][] = [
    ['Data', 'Text', 'Dialogs'],
    ['Data', 'Dialogs'],
  ];
  for (const parts of csvPaths) {
    try {
      const dir = await traverseDir(rootDir, ...parts);
      csvHandle = await dir.getFileHandle('140000.csv');
      const parsed = parseCsvText(await (await csvHandle.getFile()).text());
      csvTexts = parsed.texts;
      csvLines = parsed.lines;
      break;
    } catch {}
  }
  if (!csvHandle) {
    warnings.push(
      '140000.csv not found in Data/Text/Dialogs/ or Data/Dialogs/',
    );
  }

  if (!configHandle) throw new Error('Could not load crafting_config.json');

  // Migrate recipes whose result item no longer exists in items JSON
  // → set their category to '__undef__' so they appear uncategorized
  const knownSymbols = new Set(items.map((i) => i.dbSymbol));
  for (const [key, recipe] of Object.entries(config.data)) {
    if (recipe.result && !knownSymbols.has(recipe.result)) {
      config.data[key] = { ...recipe, category: '__undef__' };
    }
  }

  return {
    projectName,
    projectIconUrl,
    config,
    configHandle,
    items,
    itemIcons,
    csvHandle,
    csvTexts,
    csvLines,
    warnings,
  };
}

export function parseCsvText(text: string): {
  texts: Record<number, string>;
  lines: string[];
} {
  const lines = text.split('\n');
  const texts: Record<number, string> = {};
  lines.forEach((line, i) => {
    const c = line.trim().replace(/^"|"$/g, '');
    if (c) texts[i] = c;
  });
  return { texts, lines };
}

export async function writeJsonToHandle(
  handle: FileSystemFileHandle,
  obj: unknown,
): Promise<void> {
  const writable = await (handle as any).createWritable();
  await writable.write(JSON.stringify(obj, null, 2));
  await writable.close();
}

export async function writeCsvToHandle(
  handle: FileSystemFileHandle,
  lines: string[],
): Promise<void> {
  const writable = await (handle as any).createWritable();
  await writable.write(lines.join('\n'));
  await writable.close();
}

export function getCsvText(texts: Record<number, string>, id: number): string {
  return texts[id + 1] !== undefined ? texts[id + 1] : `[${id}]`;
}
