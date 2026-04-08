import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useVaultStore } from '../store/vaultStore';

export function LockScreen() {
  const { paymentStatus, setPaymentStatus, setPaymentError, paymentError, setUnlocked, setView } = useVaultStore();
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [unlockAddress, setUnlockAddress] = useState('');
  const [unlockAmount, setUnlockAmount] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePasswordSubmit = async () => {
    const valid = await window.bitcoinVault.verifyPassword(passwordInput);
    if (!valid) {
      setPasswordError('Incorrect password');
      return;
    }
    setPasswordError('');
    setAuthenticated(true);

    // Load vault to get config and start payment flow
    try {
      const index = await window.bitcoinVault.loadVault();
      setUnlockAmount(index.settings.unlockCostSats);

      const { address } = await window.bitcoinVault.getUnlockAddress();
      setUnlockAddress(address);
      setPaymentStatus('waiting');

      // Start polling
      startPolling(address, index.settings.unlockCostSats);
    } catch (err) {
      setPaymentError('Failed to load vault');
    }
  };

  const startPolling = (address: string, amount: number) => {
    if (pollRef.current) clearInterval(pollRef.current);

    const poll = async () => {
      try {
        const result = await window.bitcoinVault.pollPayment(address, amount);
        if (result.confirmed) {
          if (pollRef.current) clearInterval(pollRef.current);
          setPaymentStatus('confirmed');
          // Brief delay then unlock
          setTimeout(() => {
            setUnlocked(true);
            setView('vault');
          }, 1500);
        } else if (result.detected) {
          setPaymentStatus('detected');
        }
      } catch {
        // Ignore polling errors
      }
    };

    poll(); // Immediate first check
    pollRef.current = setInterval(poll, 15000);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const copyAddress = async () => {
    await window.bitcoinVault.copyToClipboard(unlockAddress);
  };

  const bip21Uri = unlockAddress
    ? `bitcoin:${unlockAddress}?amount=${(unlockAmount / 100_000_000).toFixed(8)}`
    : '';

  // Password entry
  if (!authenticated) {
    return (
      <div className="flex flex-col h-screen bg-gray-950">
        <div className="h-8 shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
        <div className="flex-1 flex items-center justify-center">
        <div className="max-w-sm w-80 px-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-1">Bitcoin Vault</h1>
            <p className="text-gray-500 text-sm">Enter your password to continue</p>
          </div>
          <input
            type="password"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
            placeholder="Password"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
            autoFocus
          />
          {(passwordError || paymentError) && (
            <p className="text-orange-400 text-sm">{passwordError || paymentError}</p>
          )}
          <button
            onClick={handlePasswordSubmit}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold transition-colors"
          >
            Unlock
          </button>
        </div>
        </div>
      </div>
    );
  }

  // Payment screen
  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <div className="h-8 shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
      <div className="flex-1 flex items-center justify-center">
      <div className="max-w-sm w-80 px-8 space-y-6 text-center">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={bip21Uri} size={200} level="M" />
          </div>
        </div>

        {/* Address */}
        <div
          onClick={copyAddress}
          className="font-mono text-xs text-gray-300 break-all cursor-pointer hover:text-white transition-colors px-2"
          title="Click to copy"
        >
          {unlockAddress}
        </div>

        {/* Amount */}
        <div className="text-white text-xl font-semibold">
          Send {unlockAmount.toLocaleString()} sats to unlock
        </div>

        {/* Status */}
        <div className="text-sm">
          {paymentStatus === 'waiting' && (
            <span className="text-gray-400">Waiting for payment...</span>
          )}
          {paymentStatus === 'detected' && (
            <span className="text-orange-400">Transaction detected. Waiting for confirmation...</span>
          )}
          {paymentStatus === 'confirmed' && (
            <span className="text-white">Payment confirmed. Unlocking vault...</span>
          )}
          {paymentStatus === 'error' && (
            <span className="text-orange-400">{paymentError}</span>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
