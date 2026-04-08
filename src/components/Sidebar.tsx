import React, { useEffect } from 'react';
import { useVaultStore } from '../store/vaultStore';

export function Sidebar() {
  const { view, setView, networkType, balance, formatAmount, lockVault, setBalance } = useVaultStore();

  useEffect(() => {
    // Fetch balance on mount
    (async () => {
      try {
        const bal = await window.bitcoinVault.getBalance();
        setBalance(bal);
      } catch {
        // Ignore
      }
    })();
  }, [view]);

  const handleLock = async () => {
    await window.bitcoinVault.lockVault();
    lockVault();
  };

  const navItems: Array<{ id: string; label: string; view: 'vault' | 'wallet' | 'settings' | 'howto' }> = [
    { id: 'vault', label: 'Vault', view: 'vault' },
    { id: 'wallet', label: 'Wallet', view: 'wallet' },
    { id: 'settings', label: 'Settings', view: 'settings' },
    { id: 'howto', label: 'How To', view: 'howto' },
  ];

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col p-4 pt-10">
      {/* Testnet badge */}
      {networkType === 'testnet' && (
        <div className="mb-4 px-2 py-1 bg-orange-600/20 text-orange-400 text-xs font-semibold rounded text-center">
          TESTNET
        </div>
      )}

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.view)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === item.view
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="space-y-3 pt-4 border-t border-gray-800">
        {/* Hot wallet warning */}
        <div className="text-xs text-gray-500 text-center">
          Hot wallet — small amounts only
        </div>

        {/* Balance */}
        <div className="text-center">
          <div className="text-orange-400 font-mono text-sm">
            {formatAmount(balance)}
          </div>
        </div>

        {/* Lock button */}
        <button
          onClick={handleLock}
          className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
        >
          Lock Vault
        </button>
      </div>
    </aside>
  );
}
