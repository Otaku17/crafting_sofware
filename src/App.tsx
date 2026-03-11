import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { TitleBar } from './components/TitleBar/TitleBar';
import { Toolbar } from './components/Toolbar/Toolbar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { RecipeEditor } from './components/RecipeEditor/RecipeEditor';
import { CategoryManager } from './components/CategoryManager/CategoryManager';
import { JsonViewer } from './components/JsonViewer/JsonViewer';
import { NewRecipeModal } from './components/Modal/NewRecipeModal';
import { ToastContainer } from './components/Toast/Toast';
import { StatusBar } from './components/layout/StatusBar';
import { UpdatePrompt } from './components/layout/UpdatePrompt';
import styles from './App.module.css';

export const App: React.FC = () => {
  const { activeTab, setActiveTab, saveAll, configHandle, openProject } = useStore();
  const [newRecipeOpen, setNewRecipeOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (configHandle) saveAll();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        openProject();
      }
      if (e.key === 'Escape') setNewRecipeOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [configHandle]);

  return (
    <div className={styles.app}>
      <TitleBar />
      <Toolbar onNewRecipe={() => setNewRecipeOpen(true)} />

      <div className={styles.body}>
        <Sidebar onManageCategories={() => setActiveTab('cat')} />

        <main className={styles.main}>
          {/* Tab bar */}
          <div className={styles.tabs}>
            {(['recipe', 'cat', 'json'] as const).map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'recipe' ? 'Recipe' : tab === 'cat' ? 'Categories' : 'JSON'}
              </button>
            ))}
          </div>

          {/* Panels */}
          <div className={styles.panels}>
            {activeTab === 'recipe' && <RecipeEditor />}
            {activeTab === 'cat'    && <CategoryManager />}
            {activeTab === 'json'   && <JsonViewer />}
          </div>
        </main>
      </div>

      <StatusBar />
      <UpdatePrompt />
      <NewRecipeModal open={newRecipeOpen} onClose={() => setNewRecipeOpen(false)} />
      <ToastContainer />
    </div>
  );
};
