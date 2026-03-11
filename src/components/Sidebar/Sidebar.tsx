import React, { useState } from 'react';
import { useStore } from '../../store';
import { t } from '../../utils/i18n';
import { Badge, catVariant } from '../layout/Badge';
import styles from './Sidebar.module.css';

interface SidebarProps {
  onManageCategories: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onManageCategories }) => {
  const { lang, config, currentKey, dirtyKeys, setCurrentKey, setActiveTab } = useStore();
  const [filter, setFilter] = useState('');

  const keys = Object.keys(config.data);
  const filtered = filter
    ? keys.filter((k) => {
        const r = config.data[k];
        return k.includes(filter.toLowerCase()) || (r.category || '').includes(filter.toLowerCase());
      })
    : keys;

  const openRecipe = (key: string) => {
    setCurrentKey(key);
    setActiveTab('recipe');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.head}>
        <h3 className={styles.headTitle}>{t(lang, 'recipes')}</h3>
        <span className={styles.count}>{keys.length}</span>
      </div>

      <div className={styles.search}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={t(lang, 'filter_ph')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className={styles.list}>
        {filtered.map((key) => {
          const cat = config.data[key].category || 'all';
          const isActive = key === currentKey;
          const isDirty = dirtyKeys.has(key);

          return (
            <div
              key={key}
              className={`${styles.item} ${isActive ? styles.active : ''} ${isDirty ? styles.dirty : ''}`}
              onClick={() => openRecipe(key)}
            >
              <span className={styles.itemKey}>{key}</span>
              <Badge variant={catVariant(cat)}>{cat}</Badge>
            </div>
          );
        })}
      </div>

      <div className={styles.foot}>
        <button className={styles.catBtn} onClick={onManageCategories}>
          🏷 {t(lang, 'manage_cats')}
        </button>
      </div>
    </aside>
  );
};
