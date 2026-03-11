import React from 'react';
import { useStore } from '../../store';
import { t } from '../../utils/i18n';
import { Button } from '../layout/Button';
import { FormGroup, Select, Input } from '../layout/Form';
import { IngredientsEditor } from './IngredientsEditor';
import { ConditionEditor } from './ConditionEditor';
import styles from './RecipeEditor.module.css';

const SaveIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const MonitorIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);
const ListIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

export const RecipeEditor: React.FC = () => {
  const { lang, config, currentKey, configHandle, dirtyKeys, saveAll, deleteRecipe, updateRecipeField, items, addIngredient } = useStore();

  if (!configHandle) return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}><MonitorIcon /></div>
      <h3>{t(lang, 'empty_open_title')}</h3>
      <p dangerouslySetInnerHTML={{ __html: t(lang, 'empty_open_desc') }} />
    </div>
  );

  if (!currentKey) return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}><ListIcon /></div>
      <h3>{t(lang, 'empty_sel_title')}</h3>
      <p dangerouslySetInnerHTML={{ __html: t(lang, 'empty_sel_desc') }} />
    </div>
  );

  const recipe = config.data[currentKey];
  if (!recipe) return null;

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

  const catOptions = (config.categories || []).map((c) => Object.keys(c)[0]);

  return (
    <div className={styles.editor}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.recipeKey}>{currentKey}</h2>
          {dirtyKeys.has(currentKey) && <span className={styles.dirtyBadge}>Unsaved</span>}
        </div>
        <div className={styles.headerActions}>
          <Button variant="success" size="sm" onClick={saveAll}>
            <SaveIcon /> {t(lang, 'save')}
          </Button>
          <Button variant="danger" size="sm" onClick={() => {
            if (confirm(t(lang, 'confirm_del_rec').replace('{k}', currentKey)))
              deleteRecipe(currentKey);
          }}>
            <TrashIcon /> {t(lang, 'delete')}
          </Button>
        </div>
      </div>

      {/* Base fields */}
      <div className={styles.fieldRow}>
        <FormGroup label={t(lang, 'result_lbl')}>
          <Select value={recipe.result} onChange={(e) => updateRecipeField(currentKey, 'result', e.target.value)}>
            {itemOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label={t(lang, 'qty_lbl')}>
          <Input type="number" value={recipe.quantity ?? 1} min={1}
            onChange={(e) => updateRecipeField(currentKey, 'quantity', parseInt(e.target.value))} />
        </FormGroup>
        <FormGroup label={t(lang, 'cat_lbl')}>
          <Select value={recipe.category ?? 'all'}
            onChange={(e) => updateRecipeField(currentKey, 'category', e.target.value)}>
            {catOptions.length === 0 && <option value="all">all</option>}
            {catOptions.map((k) => <option key={k} value={k}>{k}</option>)}
          </Select>
        </FormGroup>
      </div>

      {/* Ingredients */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionDot} style={{ background: 'var(--accent)' }} />
          <span className={styles.sectionTitle}>{t(lang, 'ingredients')}</span>
          <div className={styles.sectionActions}>
            <Button variant="ghost" size="sm" onClick={() => addIngredient(currentKey)}>
              <PlusIcon /> {t(lang, 'add_ingr')}
            </Button>
          </div>
        </div>
        <div className={styles.sectionBody}>
          <IngredientsEditor recipeKey={currentKey} />
        </div>
      </div>

      {/* Unlock condition */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionDot} style={{ background: 'var(--yellow)' }} />
          <span className={styles.sectionTitle}>{t(lang, 'unlock_cond')}</span>
        </div>
        <div className={styles.sectionBody}>
          <ConditionEditor recipeKey={currentKey} />
        </div>
      </div>
    </div>
  );
};
