import React, { useEffect, useState } from 'react';
import { useVaultStore } from './store/vaultStore';
import { SetupWizard } from './components/SetupWizard';
import { LockScreen } from './components/LockScreen';
import { Sidebar } from './components/Sidebar';
import { VaultBrowser } from './components/VaultBrowser';
import { WalletView } from './components/WalletView';
import { SettingsView } from './components/SettingsView';
import { HowTo } from './components/HowTo';

export function App() {
  const { view, setView, isSetupComplete, setSetupComplete, isUnlocked, lockVault } = useVaultStore();
  const [loading, setLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    // Check if setup is complete
    (async () => {
      const hasSeed = await window.bitcoinVault.hasSeed();
      const hasPass = await window.bitcoinVault.hasPassword();
      if (hasSeed && hasPass) {
        setSetupComplete(true);
        setView('lock');
      } else {
        setView('setup');
      }
      setLoading(false);
    })();

    // Listen for auto-lock
    const handleLock = () => lockVault();
    window.addEventListener('vault-locked', handleLock);
    return () => window.removeEventListener('vault-locked', handleLock);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (view === 'setup') {
    return <SetupWizard onComplete={() => { setSetupComplete(true); setView('lock'); }} />;
  }

  if (view === 'lock' || !isUnlocked) {
    return (
      <LockScreen
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        passwordError={passwordError}
        onUnlock={async () => {
          const valid = await window.bitcoinVault.verifyPassword(passwordInput);
          if (!valid) {
            setPasswordError('Incorrect password');
            return;
          }
          setPasswordError('');
          setPasswordInput('');
          try {
            await window.bitcoinVault.loadVault();
            useVaultStore.getState().setUnlocked(true);
            setView('vault');
          } catch {
            setView('lock');
          }
        }}
      />
    );
  }

  // Unlocked views
  const renderContent = () => {
    switch (view) {
      case 'wallet': return <WalletView />;
      case 'settings': return <SettingsView />;
      case 'howto': return <HowTo />;
      case 'vault':
      default: return <VaultBrowser />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <div className="h-8 shrink-0 bg-gray-900" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
