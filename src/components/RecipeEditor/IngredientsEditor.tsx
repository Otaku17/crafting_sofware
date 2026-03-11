import React from 'react';
import { useStore } from '../../store';
import { t } from '../../utils/i18n';
import { Button } from '../layout/Button';
import { Select, Input } from '../layout/Form';
import styles from './IngredientsEditor.module.css';

interface Props {
  recipeKey: string;
}

export const IngredientsEditor: React.FC<Props> = ({ recipeKey }) => {
  const { lang, config, items, addIngredient, deleteIngredient, updateIngredient } = useStore();
  const recipe = config.data[recipeKey];
  const ingr = recipe?.ingredients ?? {};

  const itemOptions = React.useMemo(() => {
    if (items.length > 0) return items.map((i) => i.dbSymbol);
    // Fallback: collect from all recipes
    const extra = new Set<string>();
    Object.values(config.data).forEach((r) => {
      if (r.result) extra.add(r.result);
      Object.keys(r.ingredients || {}).forEach((k) => extra.add(k));
    });
    return [...extra].sort();
  }, [items, config.data]);

  return (
    <div className={styles.root}>
      {Object.entries(ingr).map(([item, qty]) => (
        <div key={item} className={styles.row}>
          <Select
            compact
            style={{ flex: 1 }}
            value={item}
            onChange={(e) => updateIngredient(recipeKey, item, e.target.value, null)}
          >
            {itemOptions.length === 0 && (
              <option value={item}>{item}</option>
            )}
            {itemOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>

          <span className={styles.qtyLabel}>{t(lang, 'qty_col')}</span>

          <Input
            compact
            type="number"
            style={{ width: 68, textAlign: 'center' }}
            value={qty}
            min={1}
            onChange={(e) => updateIngredient(recipeKey, item, null, parseInt(e.target.value))}
          />

          <Button variant="danger" size="sm" onClick={() => deleteIngredient(recipeKey, item)}>
            ✕
          </Button>
        </div>
      ))}

      <Button variant="ghost" size="sm" onClick={() => addIngredient(recipeKey)}>
        ＋ {t(lang, 'add_ingr')}
      </Button>
    </div>
  );
};
