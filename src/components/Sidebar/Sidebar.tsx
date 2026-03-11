import React, { useState } from 'react';
import { useStore } from '../../store';
import { t } from '../../utils/i18n';
import { Badge, catVariant } from '../layout/Badge';
import styles from './Sidebar.module.css';

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const TagIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

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
        return k.toLowerCase().includes(filter.toLowerCase())
          || (r.category || '').toLowerCase().includes(filter.toLowerCase());
      })
    : keys;

  const openRecipe = (key: string) => {
    setCurrentKey(key);
    setActiveTab('recipe');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.head}>
        <span className={styles.headTitle}>{t(lang, 'recipes')}</span>
        <span className={styles.count}>{keys.length}</span>
      </div>

      <div className={styles.search}>
        <span className={styles.searchIcon}><SearchIcon /></span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={t(lang, 'filter_ph')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>No results</div>
        )}
        {filtered.map((key) => {
          const cat = config.data[key].category || 'all';
          return (
            <div
              key={key}
              className={`${styles.item} ${key === currentKey ? styles.active : ''} ${dirtyKeys.has(key) ? styles.dirty : ''}`}
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
          <TagIcon />
          <span>{t(lang, 'manage_cats')}</span>
        </button>
      </div>
    </aside>
  );
};
