import React from 'react';
import { useVaultStore } from '../store/vaultStore';

export function HelpLink() {
  const setView = useVaultStore(s => s.setView);

  return (
    <button
      onClick={() => setView('howto')}
      className="w-6 h-6 rounded-full border border-gray-600 text-gray-500 hover:border-orange-500 hover:text-orange-400 text-xs font-semibold transition-colors flex items-center justify-center shrink-0"
      aria-label="How To"
      title="How To"
    >
      ?
    </button>
  );
}
