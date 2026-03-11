import React from 'react';
import { useStore } from '../../store';
import { t } from '../../utils/i18n';
import styles from './Toolbar.module.css';

const FolderIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const SaveIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

interface ToolbarProps {
  onNewRecipe: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onNewRecipe }) => {
  const { lang, openProject, saveAll, configHandle, items, csvTexts, config } = useStore();
  const recipeCount = Object.keys(config.data).length;

  return (
    <div className={styles.toolbar}>
      <button className={styles.btn} onClick={openProject}>
        <FolderIcon />
        <span>{t(lang, 'open_project')}</span>
      </button>

      <div className={styles.sep} />

      <button
        className={`${styles.btn} ${styles.success}`}
        onClick={saveAll}
        disabled={!configHandle}
      >
        <SaveIcon />
        <span>{t(lang, 'save_all')}</span>
      </button>

      <button
        className={`${styles.btn} ${styles.primary}`}
        onClick={onNewRecipe}
        disabled={!configHandle}
      >
        <PlusIcon />
        <span>{t(lang, 'new_recipe')}</span>
      </button>

      <div className={styles.spacer} />

      {configHandle && (
        <div className={styles.stats}>
          <span className={styles.stat}><strong>{items.length}</strong> items</span>
          <span className={styles.statDot} />
          <span className={styles.stat}><strong>{recipeCount}</strong> recipes</span>
          <span className={styles.statDot} />
          <span className={styles.stat}><strong>{Object.keys(csvTexts).length}</strong> CSV</span>
        </div>
      )}
    </div>
  );
};
