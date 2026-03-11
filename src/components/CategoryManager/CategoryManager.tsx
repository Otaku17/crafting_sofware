import React, { useState } from 'react';
import { useStore } from '../../store';
import { t } from '../../utils/i18n';
import { Badge, catVariant } from '../layout/Badge';
import { Button } from '../layout/Button';
import { Input } from '../layout/Form';
import styles from './CategoryManager.module.css';

export const CategoryManager: React.FC = () => {
  const { lang, config, csvTexts, addCategory, deleteCategory, updateCategoryId } = useStore();

  const [newKey, setNewKey] = useState('');
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');

  const getCsvName = (id: number): string => {
    return csvTexts[id + 1] !== undefined ? csvTexts[id + 1] : `[${id}]`;
  };

  const handleAdd = async () => {
    const key = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    const id = parseInt(newId);
    const name = newName.trim();
    if (!key || isNaN(id) || !name) return;
    await addCategory(key, id, name);
    setNewKey(''); setNewId(''); setNewName('');
  };

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <h2>🏷 {t(lang, 'categories_tab')}</h2>
        <p dangerouslySetInnerHTML={{ __html: t(lang, 'cat_desc') }} />
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t(lang, 'th_key')}</th>
            <th>{t(lang, 'th_tid')}</th>
            <th>{t(lang, 'th_name')}</th>
            <th style={{ textAlign: 'right' }}>{t(lang, 'th_act')}</th>
          </tr>
        </thead>
        <tbody>
          {(config.categories || []).map((obj, idx) => {
            const key = Object.keys(obj)[0];
            const id = Object.values(obj)[0] as number;
            return (
              <tr key={key} className={styles.row}>
                <td><Badge variant={catVariant(key)}>{key}</Badge></td>
                <td>
                  <input
                    type="number"
                    className={styles.idInput}
                    value={id}
                    onChange={(e) => updateCategoryId(idx, parseInt(e.target.value))}
                  />
                </td>
                <td><span className={styles.csvName}>{getCsvName(id)}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm(t(lang, 'confirm_del_cat').replace('{k}', key))) {
                        deleteCategory(idx);
                      }
                    }}
                  >
                    🗑 {t(lang, 'delete')}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className={styles.addForm}>
        <Input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder={t(lang, 'cat_key_ph')}
          style={{ width: 150 }}
        />
        <Input
          type="number"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
          placeholder="Text ID"
          style={{ width: 100 }}
        />
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t(lang, 'cat_name_ph')}
          style={{ width: 160 }}
        />
        <Button variant="primary" size="sm" onClick={handleAdd}>
          ＋ {t(lang, 'add')}
        </Button>
        <span className={styles.autoSaveHint}>{t(lang, 'auto_save')}</span>
      </div>
    </div>
  );
};
