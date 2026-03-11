import React from 'react';
import { useStore } from '../../store';
import styles from './TitleBar.module.css';

export const TitleBar: React.FC = () => {
  const { lang, setLang, projectName, configHandle, dirty } = useStore();

  return (
    <header className={styles.titlebar}>
      <span className={styles.logo}>⚒ CRAFTING EDITOR</span>
      <div className={styles.sep} />
      <span className={styles.proj}>
        {projectName ? <strong>{projectName}</strong> : <em>No project</em>}
      </span>

      <div className={styles.spacer} />

      <div className={styles.langSwitch}>
        <button
          className={`${styles.langBtn} ${lang === 'en' ? styles.langActive : ''}`}
          onClick={() => setLang('en')}
        >
          EN
        </button>
        <button
          className={`${styles.langBtn} ${lang === 'fr' ? styles.langActive : ''}`}
          onClick={() => setLang('fr')}
        >
          FR
        </button>
      </div>

      <div className={styles.sep} />

      <div className={styles.status}>
        <span
          className={`${styles.dot} ${
            !configHandle ? '' : dirty ? styles.dotWarn : styles.dotOk
          }`}
        />
        <span className={styles.statusLabel}>
          {!configHandle ? '—' : dirty ? 'Unsaved' : 'Saved'}
        </span>
      </div>
    </header>
  );
};
