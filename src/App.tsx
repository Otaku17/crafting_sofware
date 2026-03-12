import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { TitleBar } from './components/TitleBar/TitleBar';
import { Toolbar } from './components/Toolbar/Toolbar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { RecipeEditor } from './components/RecipeEditor/RecipeEditor';
import { CategoryManager } from './components/CategoryManager/CategoryManager';
import { JsonViewer } from './components/JsonViewer/JsonViewer';
import { NewRecipeModal } from './components/Modal/NewRecipeModal';
import { MissingFilesModal } from './components/Modal/MissingFilesModal';
import { UpdatePrompt } from './components/layout/UpdatePrompt';
import styles from './App.module.css';

const TABS = [
  { id: 'recipe' as const, label: 'Recipe' },
  { id: 'cat'    as const, label: 'Categories' },
  { id: 'json'   as const, label: 'JSON' },
];

export const App: React.FC = () => {
  const { activeTab, setActiveTab, saveAll, configHandle, openProject, dirty, missingFilesWarnings, missingFilesOpen, closeMissingFiles } = useStore();
  const [newRecipeOpen, setNewRecipeOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (configHandle) saveAll(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') { e.preventDefault(); openProject(); }
      if (e.key === 'Escape') setNewRecipeOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [configHandle]);

  return (
    <div className={styles.app}>
      {configHandle && <TitleBar />}
      {configHandle && <Toolbar onManageCategories={() => setActiveTab('cat')} />}

      <div className={styles.body}>
        {configHandle && <Sidebar onNewRecipe={() => setNewRecipeOpen(true)} />}

        <main className={styles.main}>
          {configHandle && (
            <div className={styles.tabs}>
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(id)}
                >
                  {label}
                  {id === 'recipe' && dirty && <span className={styles.tabDot} />}
                </button>
              ))}
            </div>
          )}

          <div className={styles.panels}>
            {activeTab === 'recipe' && <RecipeEditor />}
            {activeTab === 'cat'    && configHandle && <CategoryManager />}
            {activeTab === 'json'   && configHandle && <JsonViewer />}
          </div>
        </main>
      </div>

      <UpdatePrompt />
      <NewRecipeModal open={newRecipeOpen} onClose={() => setNewRecipeOpen(false)} />
      <MissingFilesModal open={missingFilesOpen} warnings={missingFilesWarnings} onClose={closeMissingFiles} />
    </div>
  );
};
