import React, { useEffect, useState } from 'react';
import { useVaultStore } from '../store/vaultStore';
import type { UTXO, TransactionDetail } from '../types/vault';

export function WalletView() {
  const { balance, setBalance, formatAmount, utxos, setUtxos } = useVaultStore();
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [feeRate, setFeeRate] = useState(0);
  const [fees, setFees] = useState<{ fast: number; medium: number; slow: number } | null>(null);
  const [txDetail, setTxDetail] = useState<TransactionDetail | null>(null);
  const [sending, setSending] = useState(false);
  const [txResult, setTxResult] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    try {
      const [bal, utxoList, feeEstimates] = await Promise.all([
        window.bitcoinVault.getBalance(),
        window.bitcoinVault.getUtxos(),
        window.bitcoinVault.getFees(),
      ]);
      setBalance(bal);
      setUtxos(utxoList);
      setFees(feeEstimates);
      setFeeRate(feeEstimates.medium);
    } catch {
      // Ignore
    }
  };

  const handlePreview = async () => {
    setError('');
    setTxDetail(null);
    const amount = parseInt(sendAmount);
    if (!sendAddress || isNaN(amount) || amount <= 0) {
      setError('Enter a valid address and amount.');
      return;
    }
    try {
      const detail = await window.bitcoinVault.buildTransaction(sendAddress, amount, feeRate);
      setTxDetail(detail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to build transaction');
    }
  };

  const handleSend = async () => {
    if (!txDetail) return;
    setSending(true);
    setError('');
    try {
      const amount = parseInt(sendAmount);
      const txid = await window.bitcoinVault.broadcastTransaction(sendAddress, amount, feeRate);
      setTxResult(txid);
      setTxDetail(null);
      setSendAddress('');
      setSendAmount('');
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Broadcast failed');
    }
    setSending(false);
  };

  const truncateAddr = (addr: string) => `${addr.slice(0, 12)}...${addr.slice(-8)}`;

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-white mb-6">Wallet</h2>

      {/* Balance */}
      <div className="bg-gray-900 rounded-xl p-6 mb-6">
        <div className="text-gray-400 text-sm mb-1">Balance</div>
        <div className="text-orange-400 font-mono text-3xl font-bold">
          {formatAmount(balance)}
        </div>
      </div>

      {/* UTXOs */}
      <div className="mb-8">
        <h3 className="text-gray-400 text-sm font-semibold mb-3">UTXOs ({utxos.length})</h3>
        {utxos.length === 0 ? (
          <p className="text-gray-600 text-sm">No UTXOs yet. Unlock payments will appear here.</p>
        ) : (
          <div className="space-y-1">
            {utxos.map((u, i) => (
              <div key={`${u.txid}:${u.vout}`} className="flex items-center justify-between px-3 py-2 bg-gray-900/50 rounded-lg text-sm">
                <span className="text-orange-400 font-mono">{u.value.toLocaleString()} sats</span>
                <span className="text-gray-500 font-mono text-xs">{truncateAddr(u.address)}</span>
                <span className="text-gray-600 text-xs">{u.confirmations}+ conf</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send */}
      <div className="space-y-4">
        <h3 className="text-gray-400 text-sm font-semibold">Send</h3>

        <div>
          <label className="text-gray-500 text-xs">Destination Address</label>
          <input
            type="text"
            value={sendAddress}
            onChange={e => setSendAddress(e.target.value)}
            className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-orange-500"
            placeholder="bc1q... or tb1q..."
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-gray-500 text-xs">Amount (sats)</label>
            <input
              type="number"
              value={sendAmount}
              onChange={e => setSendAmount(e.target.value)}
              className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-orange-500"
              placeholder="0"
            />
          </div>
          <div className="w-40">
            <label className="text-gray-500 text-xs">Fee Rate (sat/vB)</label>
            {fees && (
              <select
                value={feeRate}
                onChange={e => setFeeRate(parseInt(e.target.value))}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
              >
                <option value={fees.fast}>Fast ({fees.fast})</option>
                <option value={fees.medium}>Medium ({fees.medium})</option>
                <option value={fees.slow}>Slow ({fees.slow})</option>
              </select>
            )}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {txResult && (
          <p className="text-green-400 text-sm font-mono break-all">
            Broadcast: {txResult}
          </p>
        )}

        {!txDetail ? (
          <button
            onClick={handlePreview}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Review Transaction
          </button>
        ) : (
          <div className="bg-gray-900 rounded-xl p-4 space-y-3">
            <h4 className="text-white font-semibold text-sm">Transaction Detail</h4>

            <div>
              <div className="text-gray-500 text-xs mb-1">Inputs</div>
              {txDetail.inputs.map((inp, i) => (
                <div key={i} className="text-xs font-mono text-gray-400">
                  {inp.txid.slice(0, 16)}...:{inp.vout} ({inp.value.toLocaleString()} sats)
                </div>
              ))}
            </div>

            <div>
              <div className="text-gray-500 text-xs mb-1">Outputs</div>
              {txDetail.outputs.map((out, i) => (
                <div key={i} className="text-xs font-mono text-gray-400">
                  {truncateAddr(out.address)} ({out.value.toLocaleString()} sats)
                </div>
              ))}
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Fee</span>
              <span className="text-white font-mono">{txDetail.fee.toLocaleString()} sats ({txDetail.feeRate} sat/vB)</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setTxDetail(null)}
                className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm transition-colors hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors hover:bg-orange-500 disabled:opacity-50"
              >
                {sending ? 'Broadcasting...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
