import React from 'react';
import { useVaultStore } from '../store/vaultStore';
import { HelpLink } from './HelpLink';

export function SettingsView() {
  const { vaultIndex, networkType, denomination, setDenomination, autoLockMinutes, setAutoLockMinutes } = useVaultStore();

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <HelpLink />
      </div>

      <div className="space-y-6">
        {/* Vault */}
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Vault</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
              <span className="text-gray-300 text-sm">Unlock Cost</span>
              <span className="text-white font-mono text-sm">
                {vaultIndex?.settings.unlockCostSats.toLocaleString() ?? '—'} sats
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
              <span className="text-gray-300 text-sm">Unlock Frequency</span>
              <span className="text-white text-sm capitalize">
                {vaultIndex?.settings.unlockFrequency.replace('-', ' ') ?? '—'}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
              <span className="text-gray-300 text-sm">Vault Folder</span>
              <span className="text-gray-400 text-xs font-mono truncate max-w-48">
                {vaultIndex?.settings.vaultFolderPath ?? '—'}
              </span>
            </div>
          </div>
        </section>

        {/* Display */}
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Display</h3>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
            <span className="text-gray-300 text-sm">Denomination</span>
            <div className="flex bg-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setDenomination('sats')}
                className={`px-3 py-1 text-sm ${denomination === 'sats' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}
              >
                sats
              </button>
              <button
                onClick={() => setDenomination('btc')}
                className={`px-3 py-1 text-sm ${denomination === 'btc' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}
              >
                BTC
              </button>
            </div>
          </div>
        </section>

        {/* Security */}
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Security</h3>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
            <span className="text-gray-300 text-sm">Auto-Lock Timer</span>
            <select
              value={autoLockMinutes}
              onChange={e => setAutoLockMinutes(parseInt(e.target.value))}
              className="bg-gray-800 border-none text-white text-sm rounded px-2 py-1 focus:outline-none"
            >
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>
        </section>

        {/* Network */}
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Network</h3>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
            <span className="text-gray-300 text-sm">Network</span>
            <span className={`text-sm font-semibold ${networkType === 'testnet' ? 'text-orange-400' : 'text-white'}`}>
              {networkType === 'testnet' ? 'Testnet' : 'Mainnet'}
            </span>
          </div>
        </section>

        {/* About */}
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">About</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
              <span className="text-gray-300 text-sm">Version</span>
              <span className="text-gray-400 text-sm">0.1.0</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
              <span className="text-gray-300 text-sm">Repository</span>
              <span className="text-gray-400 text-xs font-mono">github.com/Evapotrack/bitcoin-vault</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
