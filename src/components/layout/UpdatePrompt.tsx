import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './UpdatePrompt.module.css';

// Install prompt — fires before browser shows A2HS
let deferredPrompt: any = null;

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };
    // If already captured before mount
    if (deferredPrompt) setCanInstall(true);
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { deferredPrompt = null; setCanInstall(false); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') { deferredPrompt = null; setCanInstall(false); }
  };

  return { canInstall, install };
}

export const UpdatePrompt: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    // Poll every 60s for new SW — catches deploys while app is open
    onRegistered(r) {
      if (r) {
        setInterval(() => r.update(), 60_000);
      }
    },
    onRegisterError(e) {
      console.warn('[PWA] SW error', e);
    },
  });

  if (!needRefresh || dismissed) return null;

  return (
    <div className={styles.prompt}>
      <span>🔄 New version available</span>
      <button onClick={() => updateServiceWorker(true)}>Update now</button>
      <button onClick={() => setDismissed(true)}>✕</button>
    </div>
  );
};
