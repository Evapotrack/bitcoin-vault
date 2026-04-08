import React, { useState } from 'react';
import type { VaultConfig, UnlockFrequency } from '../types/vault';

interface Props {
  onComplete: () => void;
}

type Step = 'welcome' | 'seed-display' | 'seed-verify' | 'config' | 'done';

export function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('welcome');
  const [isRestore, setIsRestore] = useState(false);
  const [seedWords, setSeedWords] = useState<string[]>([]);
  const [verifyIndices, setVerifyIndices] = useState<number[]>([]);
  const [verifyInputs, setVerifyInputs] = useState<string[]>(['', '', '']);
  const [verifyError, setVerifyError] = useState('');
  const [restoreWords, setRestoreWords] = useState<string[]>(Array(12).fill(''));
  const [restoreError, setRestoreError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [networkType, setNetworkType] = useState<'testnet' | 'mainnet'>('testnet');
  const [unlockCost, setUnlockCost] = useState('750');
  const [frequency, setFrequency] = useState<UnlockFrequency>('per-session');
  const [vaultFolder, setVaultFolder] = useState('');
  const [autoLock, setAutoLock] = useState('15');
  const [configError, setConfigError] = useState('');
  const [firstAddresses, setFirstAddresses] = useState<string[]>([]);

  const handleCreateNew = async () => {
    const words = await window.bitcoinVault.generateSeed();
    setSeedWords(words);
    // Pick 3 random indices for verification
    const indices: number[] = [];
    while (indices.length < 3) {
      const i = Math.floor(Math.random() * 12);
      if (!indices.includes(i)) indices.push(i);
    }
    setVerifyIndices(indices.sort((a, b) => a - b));
    setStep('seed-display');
  };

  const handleRestore = () => {
    setIsRestore(true);
    setStep('seed-verify');
  };

  const handleVerify = () => {
    for (let i = 0; i < 3; i++) {
      if (verifyInputs[i].toLowerCase().trim() !== seedWords[verifyIndices[i]]) {
        setVerifyError(`Word ${verifyIndices[i] + 1} is incorrect. Please check and try again.`);
        return;
      }
    }
    setVerifyError('');
    setStep('config');
  };

  const handleRestoreVerify = async () => {
    const words = restoreWords.map(w => w.toLowerCase().trim());
    if (words.some(w => !w)) {
      setRestoreError('Please enter all 12 words.');
      return;
    }
    const valid = await window.bitcoinVault.restoreSeed(words);
    if (!valid) {
      setRestoreError('Invalid seed phrase. Check spelling and order.');
      return;
    }
    setSeedWords(words);
    setRestoreError('');
    setStep('config');
  };

  const handleConfig = async () => {
    if (!password || password.length < 8) {
      setConfigError('Password must be at least 8 characters.');
      return;
    }
    if (password !== passwordConfirm) {
      setConfigError('Passwords do not match.');
      return;
    }
    if (!vaultFolder) {
      setConfigError('Please select a vault folder.');
      return;
    }
    const cost = parseInt(unlockCost);
    if (isNaN(cost) || cost < 750) {
      setConfigError('Unlock cost must be at least 750 sats.');
      return;
    }

    setConfigError('');

    // Store password
    await window.bitcoinVault.setPassword(password);

    // Store seed if not already (create new path)
    if (!isRestore) {
      await window.bitcoinVault.storeSeed(seedWords);
    }

    // Create vault
    const config: VaultConfig = {
      networkType,
      unlockCostSats: cost,
      unlockFrequency: frequency,
      vaultFolderPath: vaultFolder,
      autoLockMinutes: parseInt(autoLock) || 15,
      denomination: 'sats',
    };
    await window.bitcoinVault.createVault(config);

    // Verify first addresses (S22)
    const addrs = await window.bitcoinVault.verifyFirstAddresses();
    setFirstAddresses(addrs);

    setStep('done');
  };

  const selectFolder = async () => {
    const folder = await window.bitcoinVault.selectFolder();
    if (folder) setVaultFolder(folder);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <div className="h-8 shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
      <div className="flex-1 flex items-center justify-center overflow-auto">
      <div className="w-full max-w-md px-8 py-4">
        {/* Welcome */}
        {step === 'welcome' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Bitcoin Vault</h1>
              <p className="text-gray-400">Encrypt your files locally. Unlock them with Bitcoin.</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleCreateNew}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold text-lg transition-colors"
              >
                Create New Vault
              </button>
              <button
                onClick={handleRestore}
                className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-semibold transition-colors"
              >
                Restore Existing Vault
              </button>
            </div>
          </div>
        )}

        {/* Seed Display */}
        {step === 'seed-display' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Your Seed Phrase</h2>
              <p className="text-orange-400 text-sm font-semibold">
                Write these words down on paper. This is the only time they will be shown.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {seedWords.map((word, i) => (
                <div key={i} className="bg-gray-900 rounded-lg p-3 text-center">
                  <span className="text-gray-500 text-xs">{i + 1}.</span>{' '}
                  <span className="text-white font-mono">{word}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep('seed-verify')}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold transition-colors"
            >
              I wrote them down
            </button>
          </div>
        )}

        {/* Seed Verify */}
        {step === 'seed-verify' && !isRestore && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Verify Your Seed</h2>
              <p className="text-gray-400 text-sm">Enter the requested words to confirm.</p>
            </div>
            <div className="space-y-4">
              {verifyIndices.map((idx, i) => (
                <div key={idx}>
                  <label className="text-gray-400 text-sm">Word {idx + 1}</label>
                  <input
                    type="text"
                    value={verifyInputs[i]}
                    onChange={e => {
                      const arr = [...verifyInputs];
                      arr[i] = e.target.value;
                      setVerifyInputs(arr);
                    }}
                    className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-orange-500"
                    autoComplete="off"
                  />
                </div>
              ))}
            </div>
            {verifyError && <p className="text-orange-400 text-sm">{verifyError}</p>}
            <button
              onClick={handleVerify}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold transition-colors"
            >
              Verify
            </button>
          </div>
        )}

        {/* Restore Seed Entry */}
        {step === 'seed-verify' && isRestore && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Enter Your Seed Phrase</h2>
              <p className="text-gray-400 text-sm">Enter all 12 words in order.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {restoreWords.map((word, i) => (
                <div key={i}>
                  <label className="text-gray-500 text-xs">{i + 1}.</label>
                  <input
                    type="text"
                    value={word}
                    onChange={e => {
                      const arr = [...restoreWords];
                      arr[i] = e.target.value;
                      setRestoreWords(arr);
                    }}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-white font-mono text-sm focus:outline-none focus:border-orange-500"
                    autoComplete="off"
                  />
                </div>
              ))}
            </div>
            {restoreError && <p className="text-orange-400 text-sm">{restoreError}</p>}
            <button
              onClick={handleRestoreVerify}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold transition-colors"
            >
              Restore
            </button>
          </div>
        )}

        {/* Config */}
        {step === 'config' && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-white text-center">Configure Your Vault</h2>

            <div>
              <label className="text-gray-400 text-sm">Password (min 8 characters)</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Confirm Password</label>
              <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" />
            </div>

            <div>
              <label className="text-gray-400 text-sm">Network</label>
              <select value={networkType} onChange={e => setNetworkType(e.target.value as 'testnet' | 'mainnet')}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">
                <option value="testnet">Testnet</option>
                <option value="mainnet">Mainnet</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Unlock Cost (sats, min 750)</label>
              <input type="number" value={unlockCost} onChange={e => setUnlockCost(e.target.value)} min={750}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-orange-500" />
            </div>

            <div>
              <label className="text-gray-400 text-sm">Unlock Frequency</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value as UnlockFrequency)}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">
                <option value="per-session">Per Session</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Auto-Lock Timer (minutes)</label>
              <select value={autoLock} onChange={e => setAutoLock(e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Vault Folder</label>
              <div className="flex gap-2 mt-1">
                <input type="text" value={vaultFolder} readOnly
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none" />
                <button onClick={selectFolder}
                  className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors whitespace-nowrap">
                  Browse
                </button>
              </div>
            </div>

            {configError && <p className="text-orange-400 text-sm">{configError}</p>}

            <button onClick={handleConfig}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold transition-colors">
              Create Vault
            </button>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-bold text-white">Vault Created</h2>
            <p className="text-gray-400">
              Your vault is ready. Store your seed phrase securely — it is the only way to recover your files and wallet.
            </p>
            {firstAddresses.length > 0 && (
              <div className="text-left">
                <p className="text-gray-500 text-sm mb-2">First 5 addresses (for derivation verification):</p>
                <div className="bg-gray-900 rounded-lg p-3 space-y-1">
                  {firstAddresses.map((addr, i) => (
                    <div key={i} className="text-xs font-mono text-gray-400 truncate">
                      m/84&apos;/x&apos;/0&apos;/0/{i}: {addr}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={onComplete}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold transition-colors">
              Open Vault
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
