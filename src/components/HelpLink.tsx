import React from 'react';
import { useVaultStore } from '../store/vaultStore';

export function HelpLink() {
  const setView = useVaultStore(s => s.setView);

  return (
    <button
      onClick={() => setView('howto')}
      className="text-gray-500 hover:text-orange-400 text-xs transition-colors"
      aria-label="How To"
    >
      ? Help
    </button>
  );
}
