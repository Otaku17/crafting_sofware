import React from 'react';
import { useStore } from '../../store';
import { useInstallPrompt } from '../layout/UpdatePrompt';
import styles from './TitleBar.module.css';

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const HammerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m15 12-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" />
    <path d="M17.64 15 22 10.64" />
    <path d="m20.91 11.7-1.25-1.25c.15-.48.23-.98.23-1.45a5 5 0 0 0-5-5 4.83 4.83 0 0 0-1.46.23L12.2 3l2.73-2.73C16 .1 17.47 0 18 0a6 6 0 0 1 6 6c0 .52-.1 2-.7 3.28l-3.39-3.39A2 2 0 0 0 18 5" />
  </svg>
);
const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);
const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const SaveIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);

export const TitleBar: React.FC = () => {
  const { projectName, projectIconUrl, configHandle, dirty, saveAll, theme, setTheme, lang, setLang } = useStore();
  const hasFS = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  const { canInstall, install } = useInstallPrompt();

  return (
    <header className={styles.titlebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          {projectIconUrl
            ? <img src={projectIconUrl} alt="" className={styles.brandProjectIcon} />
            : <div className={styles.brandSquare} />
          }
        </div>
        <span className={styles.brandName}>Crafting Editor</span>
      </div>

      {/* Project name */}
      {projectName && (
        <>
          <div className={styles.divider} />
          <div className={styles.project}>
            <span className={styles.projectName}>{projectName}</span>
          </div>
        </>
      )}

      <div className={styles.spacer} />

      {/* Chrome warning */}
      {!hasFS && <span className={styles.browserWarn}>⚠ Chrome / Edge only</span>}

      {/* Save all */}
      {configHandle && (
        <button
          className={`${styles.saveBtn} ${dirty ? styles.saveBtnDirty : ''}`}
          onClick={saveAll}
          disabled={!dirty}
          title={dirty ? 'Save all changes' : 'All saved'}
        >
          <SaveIcon />
          <span>{dirty ? 'Save all' : 'Saved'}</span>
        </button>
      )}

      {/* Install app */}
      {canInstall && (
        <button className={styles.installBtn} onClick={install} title="Install as desktop app">
          <DownloadIcon />
          <span>Install app</span>
        </button>
      )}

      <div className={styles.divider} />

      {/* Language segmented */}
      <div className={styles.segmented}>
        <button className={`${styles.segBtn} ${lang === 'en' ? styles.segActive : ''}`} onClick={() => setLang('en')}>EN</button>
        <button className={`${styles.segBtn} ${lang === 'fr' ? styles.segActive : ''}`} onClick={() => setLang('fr')}>FR</button>
      </div>

      {/* Theme toggle */}
      <button className={styles.themeBtn} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* PWA badge */}
      <span className={styles.pwaBadge}>PWA</span>
    </header>
  );
};
