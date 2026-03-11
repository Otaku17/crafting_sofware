import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import styles from './StatusBar.module.css';

export const StatusBar: React.FC = () => {
  const { rootDir, items, csvTexts, config } = useStore();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') { setInstallPrompt(null); setInstalled(true); }
  };

  const supported = !!window.showDirectoryPicker;

  return (
    <footer className={styles.bar}>
      <span>{rootDir ? rootDir.name : 'No project'}</span>
      <div className={styles.sep} />
      <span>{items.length} items</span>
      <div className={styles.sep} />
      <span>{Object.keys(csvTexts).length} CSV</span>
      <div className={styles.sep} />
      <span>{Object.keys(config.data).length} recipes</span>
      <div style={{ flex: 1 }} />
      {!supported && (
        <span className={styles.warn}>⚠ Use Chrome or Edge for File System API</span>
      )}
      {supported && !isStandalone && !installed && installPrompt && (
        <button className={styles.installBtn} onClick={handleInstall}>
          ⬇ Install app
        </button>
      )}
      {(isStandalone || installed) && (
        <span className={styles.pwaTag}>● PWA</span>
      )}
    </footer>
  );
};
