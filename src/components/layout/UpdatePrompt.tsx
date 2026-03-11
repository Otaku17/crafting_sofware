import React, { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './UpdatePrompt.module.css';

export const UpdatePrompt: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] SW registered', r);
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
