import React, { useEffect, useState } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { HelpLink } from './HelpLink';

export function SettingsView() {
  const { vaultIndex, networkType, denomination, setDenomination, autoLockMinutes, setAutoLockMinutes } = useVaultStore();

  // Dead Man's Switch state
  const [dmsEnabled, setDmsEnabled] = useState(false);
  const [dmsDays, setDmsDays] = useState('90');
  const [dmsCost, setDmsCost] = useState('750');
  const [dmsStatus, setDmsStatus] = useState<{ enabled: boolean; expired: boolean; daysRemaining: number } | null>(null);

  useEffect(() => {
    (async () => {
      const status = await window.bitcoinVault.getDeadManSwitchStatus();
      if (status) {
        setDmsStatus(status);
        setDmsEnabled(status.enabled);
        if (status.countdownDays) setDmsDays(String(status.countdownDays));
        if (status.proofOfLifeCostSats) setDmsCost(String(status.proofOfLifeCostSats));
      }
    })();
  }, []);

  const handleAutoLock = (minutes: number) => {
    setAutoLockMinutes(minutes);
    window.bitcoinVault.updateSettings({ autoLockMinutes: minutes });
  };

  const handleDenomination = (denom: 'sats' | 'btc') => {
    setDenomination(denom);
    window.bitcoinVault.updateSettings({ denomination: denom });
  };

  const handleDmsToggle = async () => {
    const next = !dmsEnabled;
    setDmsEnabled(next);
    await window.bitcoinVault.configureDeadManSwitch({
      enabled: next,
      countdownDays: parseInt(dmsDays) || 90,
      proofOfLifeCostSats: parseInt(dmsCost) || 750,
    });
    const status = await window.bitcoinVault.getDeadManSwitchStatus();
    setDmsStatus(status);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <HelpLink />
      </div>

      <div className="space-y-6">
        {/* Vault */}
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Vault</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
              <span className="text-gray-300 text-sm">Unlock Cost</span>
              <select value={vaultIndex?.settings.unlockCostSats ?? 1500}
                onChange={e => {
                  const cost = parseInt(e.target.value);
                  if (vaultIndex) { vaultIndex.settings.unlockCostSats = cost; }
                  window.bitcoinVault.updateSettings({ unlockCostSats: cost });
                }}
                className="bg-gray-800 border-none text-white text-sm rounded px-2 py-1 font-mono focus:outline-none">
                <option value={1500}>1,500 sats</option>
                <option value={2000}>2,000 sats</option>
                <option value={5000}>5,000 sats</option>
                <option value={10000}>10,000 sats</option>
              </select>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
              <span className="text-gray-300 text-sm">Unlock Frequency</span>
              <span className="text-white text-sm capitalize">{vaultIndex?.settings.unlockFrequency.replace('-', ' ') ?? '—'}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
              <span className="text-gray-300 text-sm">Vault Folder</span>
              <span className="text-gray-400 text-xs font-mono truncate max-w-48">{vaultIndex?.settings.vaultFolderPath ?? '—'}</span>
            </div>
          </div>
        </section>

        {/* Display */}
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Display</h3>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
            <span className="text-gray-300 text-sm">Denomination</span>
            <div className="flex bg-gray-800 rounded-lg overflow-hidden">
              <button onClick={() => handleDenomination('sats')}
                className={`px-3 py-1 text-sm ${denomination === 'sats' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>sats</button>
              <button onClick={() => handleDenomination('btc')}
                className={`px-3 py-1 text-sm ${denomination === 'btc' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>BTC</button>
            </div>
          </div>
        </section>

        {/* Security */}
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Security</h3>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
            <span className="text-gray-300 text-sm">Auto-Lock Timer</span>
            <select value={autoLockMinutes} onChange={e => handleAutoLock(parseInt(e.target.value))}
              className="bg-gray-800 border-none text-white text-sm rounded px-2 py-1 focus:outline-none">
              <option value={5}>5 min</option><option value={10}>10 min</option><option value={15}>15 min</option>
              <option value={30}>30 min</option><option value={60}>60 min</option>
            </select>
          </div>
        </section>

        {/* Dead Man's Switch */}
        <section>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Dead Man&apos;s Switch</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
              <div>
                <span className="text-gray-300 text-sm">Enable</span>
                <p className="text-gray-600 text-xs mt-0.5">Removes Bitcoin payment requirement after countdown expires</p>
              </div>
              <button onClick={handleDmsToggle}
                className={`w-12 h-6 rounded-full transition-colors relative ${dmsEnabled ? 'bg-orange-600' : 'bg-gray-700'}`}>
                <span className={`block w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${dmsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {dmsEnabled && (
              <>
                <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
                  <span className="text-gray-300 text-sm">Countdown</span>
                  <select value={dmsDays} onChange={async e => {
                    setDmsDays(e.target.value);
                    if (dmsEnabled) {
                      await window.bitcoinVault.configureDeadManSwitch({ enabled: true, countdownDays: parseInt(e.target.value) || 90, proofOfLifeCostSats: parseInt(dmsCost) || 750 });
                      setDmsStatus(await window.bitcoinVault.getDeadManSwitchStatus());
                    }
                  }}
                    className="bg-gray-800 border-none text-white text-sm rounded px-2 py-1 focus:outline-none">
                    <option value="30">30 days</option><option value="60">60 days</option>
                    <option value="90">90 days</option><option value="180">180 days</option>
                    <option value="365">365 days</option>
                  </select>
                </div>
                <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-lg">
                  <span className="text-gray-300 text-sm">Proof-of-Life Cost</span>
                  <span className="text-white font-mono text-sm">{parseInt(dmsCost).toLocaleString()} sats</span>
                </div>
                {dmsStatus && dmsStatus.enabled && (
                  <div className="px-4 py-3 bg-gray-900 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Days Remaining</span>
                      <span className={`font-mono text-sm ${dmsStatus.daysRemaining <= 7 ? 'text-orange-400' : 'text-white'}`}>
                        {dmsStatus.daysRemaining}
                      </span>
                    </div>
                    {dmsStatus.expired && (
                      <p className="text-orange-400 text-xs mt-2">Switch has expired. Vault opens with seed only — no payment required.</p>
                    )}
                  </div>
                )}
              </>
            )}
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
              <span className="text-gray-400 text-sm">0.2.0</span>
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
