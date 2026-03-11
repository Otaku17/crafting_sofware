import React from 'react';
import { useStore } from '../../store';
import { t } from '../../utils/i18n';
import { Button } from '../layout/Button';
import { Select, Input } from '../layout/Form';
import styles from './IngredientsEditor.module.css';

const XIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

interface Props { recipeKey: string; }

export const IngredientsEditor: React.FC<Props> = ({ recipeKey }) => {
  const { lang, config, items, addIngredient, deleteIngredient, updateIngredient } = useStore();
  const recipe = config.data[recipeKey];
  const ingr = recipe?.ingredients ?? {};

  const itemOptions = React.useMemo(() => {
    if (items.length > 0) return items.map((i) => i.dbSymbol);
    const extra = new Set<string>();
    Object.values(config.data).forEach((r) => {
      if (r.result) extra.add(r.result);
      Object.keys(r.ingredients || {}).forEach((k) => extra.add(k));
    });
    return [...extra].sort();
  }, [items, config.data]);

  const entries = Object.entries(ingr);

  return (
    <div className={styles.root}>
      {entries.length === 0 && (
        <div className={styles.empty}>{t(lang, 'no_ingr')}</div>
      )}
      {entries.map(([item, qty]) => (
        <div key={item} className={styles.row}>
          <Select compact style={{ flex: 1 }} value={item}
            onChange={(e) => updateIngredient(recipeKey, item, e.target.value, null)}>
            {itemOptions.length === 0 && <option value={item}>{item}</option>}
            {itemOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <span className={styles.qtyLabel}>{t(lang, 'qty_col')}</span>
          <Input compact type="number" style={{ width: 64, textAlign: 'center' }}
            value={qty} min={1}
            onChange={(e) => updateIngredient(recipeKey, item, null, parseInt(e.target.value))} />
          <button className={styles.removeBtn} onClick={() => deleteIngredient(recipeKey, item)}>
            <XIcon />
          </button>
        </div>
      ))}
      <button className={styles.addRow} onClick={() => addIngredient(recipeKey)}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {t(lang, 'add_ingr')}
      </button>
    </div>
  );
};
