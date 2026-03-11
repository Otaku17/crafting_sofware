import React from 'react';
import { useStore } from '../../store';
import { t } from '../../utils/i18n';
import { Button } from '../layout/Button';
import { FormGroup, Select, Input } from '../layout/Form';
import { IngredientsEditor } from './IngredientsEditor';
import { ConditionEditor } from './ConditionEditor';
import styles from './RecipeEditor.module.css';

export const RecipeEditor: React.FC = () => {
  const {
    lang, config, currentKey, configHandle, dirtyKeys,
    saveAll, deleteRecipe, updateRecipeField, items,
  } = useStore();

  if (!configHandle) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🎮</span>
        <h3>{t(lang, 'empty_open_title')}</h3>
        <p dangerouslySetInnerHTML={{ __html: t(lang, 'empty_open_desc') }} />
      </div>
    );
  }

  if (!currentKey) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📋</span>
        <h3>{t(lang, 'empty_sel_title')}</h3>
        <p dangerouslySetInnerHTML={{ __html: t(lang, 'empty_sel_desc') }} />
      </div>
    );
  }

  const recipe = config.data[currentKey];
  if (!recipe) return null;

  const isDirty = dirtyKeys.has(currentKey);

  const itemOptions = items.length > 0
    ? items.map((i) => i.dbSymbol)
    : (() => {
        const extra = new Set<string>();
        Object.values(config.data).forEach((r) => {
          if (r.result) extra.add(r.result);
          Object.keys(r.ingredients || {}).forEach((k) => extra.add(k));
        });
        return [...extra].sort();
      })();

  const catOptions = (config.categories || []).map((c) => {
    const k = Object.keys(c)[0];
    return { key: k };
  });

  return (
    <div className={styles.editor}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.recipeKey}>{currentKey}</h2>
        {isDirty && <span className={styles.dirtyPill}>{t(lang, 'unsaved')}</span>}
        <div style={{ flex: 1 }} />
        <Button variant="success" size="sm" onClick={saveAll}>
          💾 {t(lang, 'save')}
        </Button>
        <Button variant="danger" size="sm" onClick={() => {
          if (confirm(t(lang, 'confirm_del_rec').replace('{k}', currentKey))) {
            deleteRecipe(currentKey);
          }
        }}>
          🗑 {t(lang, 'delete')}
        </Button>
      </div>

      {/* Base fields */}
      <div className={styles.fieldRow}>
        <FormGroup label={t(lang, 'result_lbl')}>
          <Select value={recipe.result} onChange={(e) => updateRecipeField(currentKey, 'result', e.target.value)}>
            {itemOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FormGroup>

        <FormGroup label={t(lang, 'qty_lbl')}>
          <Input
            type="number"
            value={recipe.quantity ?? 1}
            min={1}
            onChange={(e) => updateRecipeField(currentKey, 'quantity', parseInt(e.target.value))}
          />
        </FormGroup>

        <FormGroup label={t(lang, 'cat_lbl')}>
          <Select value={recipe.category ?? 'all'} onChange={(e) => updateRecipeField(currentKey, 'category', e.target.value)}>
            {catOptions.map(({ key }) => <option key={key} value={key}>{key}</option>)}
            {catOptions.length === 0 && <option value="all">all</option>}
          </Select>
        </FormGroup>
      </div>

      {/* Ingredients */}
      <div className={styles.block}>
        <div className={styles.blockHead}>
          <span className={styles.blockDot} style={{ background: 'var(--accent)' }} />
          <h3>{t(lang, 'ingredients')}</h3>
        </div>
        <IngredientsEditor recipeKey={currentKey} />
      </div>

      {/* Unlock condition */}
      <div className={styles.block}>
        <div className={styles.blockHead}>
          <span className={styles.blockDot} style={{ background: 'var(--yellow)' }} />
          <h3>{t(lang, 'unlock_cond')}</h3>
        </div>
        <ConditionEditor recipeKey={currentKey} />
      </div>
    </div>
  );
};
