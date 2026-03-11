import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { t } from '../../utils/i18n';
import { Button } from '../layout/Button';
import { FormGroup, Select, Input } from '../layout/Form';
import styles from './Modal.module.css';

interface NewRecipeModalProps {
  open: boolean;
  onClose: () => void;
}

export const NewRecipeModal: React.FC<NewRecipeModalProps> = ({ open, onClose }) => {
  const { lang, items, config, createRecipe } = useStore();

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

  const [item, setItem] = useState(itemOptions[0] ?? '');
  const [cat, setCat] = useState(catOptions[0] ?? 'all');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (open) {
      setItem(itemOptions[0] ?? '');
      setCat(catOptions[0] ?? 'all');
      setQty(1);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!item) return;
    await createRecipe(item, cat, qty);
    onClose();
  };

  if (!open) return null;

  // Compute preview key
  let previewKey = item;
  let i = 2;
  while (config.data[previewKey]) previewKey = `${item}_${i++}`;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <h3>➕ {t(lang, 'nr_title')}</h3>
        <p className={styles.desc}>{t(lang, 'nr_desc')}</p>

        <FormGroup label={t(lang, 'nr_item')} className={styles.field}>
          <Select value={item} onChange={(e) => setItem(e.target.value)}>
            {itemOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FormGroup>

        <FormGroup label={t(lang, 'nr_cat')} className={styles.field}>
          <Select value={cat} onChange={(e) => setCat(e.target.value)}>
            {catOptions.length === 0 && <option value="all">all</option>}
            {catOptions.map((k) => <option key={k} value={k}>{k}</option>)}
          </Select>
        </FormGroup>

        <FormGroup label={t(lang, 'nr_qty')} className={styles.field}>
          <Input type="number" value={qty} min={1} onChange={(e) => setQty(parseInt(e.target.value))} />
        </FormGroup>

        <div className={styles.preview}>
          <span className={styles.previewLabel}>{t(lang, 'key_prev')}</span>
          <span className={styles.previewKey}>{previewKey || '—'}</span>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose}>{t(lang, 'cancel')}</Button>
          <Button variant="primary" onClick={handleCreate}>{t(lang, 'create')}</Button>
        </div>
      </div>
    </div>
  );
};
