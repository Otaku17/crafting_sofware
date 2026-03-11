import React from 'react';
import { useStore } from '../../store';
import { t } from '../../utils/i18n';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  onNewRecipe: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onNewRecipe }) => {
  const { lang, openProject, saveAll, configHandle, items, csvTexts, config } = useStore();

  const recipeCount = Object.keys(config.data).length;
  const csvCount = Object.keys(csvTexts).length;

  return (
    <div className={styles.toolbar}>
      <button className={styles.tbBtn} onClick={openProject}>
        <span>📂</span>
        <span>{t(lang, 'open_project')}</span>
      </button>

      <div className={styles.sep} />

      <button
        className={`${styles.tbBtn} ${styles.success}`}
        onClick={saveAll}
        disabled={!configHandle}
      >
        <span>💾</span>
        <span>{t(lang, 'save_all')}</span>
      </button>

      <div className={styles.sep} />

      <button
        className={`${styles.tbBtn} ${styles.primary}`}
        onClick={onNewRecipe}
        disabled={!configHandle}
      >
        <span>＋</span>
        <span>{t(lang, 'new_recipe')}</span>
      </button>

      <div className={styles.sep} />

      <span className={styles.info}>
        {configHandle
          ? `${items.length} items · ${csvCount} CSV · ${recipeCount} recipes`
          : '—'}
      </span>
    </div>
  );
};
