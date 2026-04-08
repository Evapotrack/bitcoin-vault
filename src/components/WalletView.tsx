import React, { useEffect, useState } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { HelpLink } from './HelpLink';
import type { TransactionDetail } from '../types/vault';

export function WalletView() {
  const { balance, setBalance, formatAmount, utxos, setUtxos } = useVaultStore();
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [feeRate, setFeeRate] = useState(0);
  const [fees, setFees] = useState<{ fast: number; medium: number; slow: number } | null>(null);
  const [feeDetail, setFeeDetail] = useState<{ estimates: { unlockFee: { fast: number; medium: number; slow: number }; sendFee: { fast: number; medium: number; slow: number }; consolidateFee: { fast: number; medium: number; slow: number } } } | null>(null);
  const [txDetail, setTxDetail] = useState<TransactionDetail | null>(null);
  const [consolidateDetail, setConsolidateDetail] = useState<TransactionDetail | null>(null);
  const [sending, setSending] = useState(false);
  const [txResult, setTxResult] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { refresh(); }, []);

  const refresh = async () => {
    try {
      const [bal, utxoList, feeEstimates, feeEst] = await Promise.all([
        window.bitcoinVault.getBalance(),
        window.bitcoinVault.getUtxos(),
        window.bitcoinVault.getFees(),
        window.bitcoinVault.getFeeEstimateDetail(),
      ]);
      setBalance(bal); setUtxos(utxoList); setFees(feeEstimates); setFeeRate(feeEstimates.medium);
      setFeeDetail(feeEst);
    } catch { /* ignore */ }
  };

  const handlePreview = async () => {
    setError(''); setTxDetail(null);
    const amount = parseInt(sendAmount);
    if (!sendAddress || isNaN(amount) || amount <= 0) { setError('Enter a valid address and amount.'); return; }
    try {
      const detail = await window.bitcoinVault.buildTransaction(sendAddress, amount, feeRate);
      setTxDetail(detail);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleSend = async () => {
    if (!txDetail) return;
    setSending(true); setError('');
    try {
      const txid = await window.bitcoinVault.broadcastTransaction(sendAddress, parseInt(sendAmount), feeRate);
      setTxResult(txid); setTxDetail(null); setSendAddress(''); setSendAmount(''); refresh();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Broadcast failed'); }
    setSending(false);
  };

  const handleConsolidatePreview = async () => {
    setError(''); setConsolidateDetail(null);
    if (!fees) return;
    try {
      const detail = await window.bitcoinVault.buildConsolidation(fees.slow);
      setConsolidateDetail(detail);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Cannot consolidate'); }
  };

  const handleConsolidate = async () => {
    if (!fees) return;
    setSending(true); setError('');
    try {
      const txid = await window.bitcoinVault.broadcastConsolidation(fees.slow);
      setTxResult(txid); setConsolidateDetail(null); refresh();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Consolidation failed'); }
    setSending(false);
  };

  const truncateAddr = (addr: string) => `${addr.slice(0, 12)}...${addr.slice(-8)}`;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold text-white">Wallet</h2>
        <HelpLink />
      </div>

      {/* Balance */}
      <div className="bg-gray-900 rounded-xl p-6 mb-6">
        <div className="text-gray-400 text-sm mb-1">Balance</div>
        <div className="text-orange-400 font-mono text-3xl font-bold">{formatAmount(balance)}</div>
      </div>

      {/* Fee Estimates */}
      {feeDetail && (
        <div className="bg-gray-900 rounded-xl p-4 mb-6">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Current Fee Estimates</h3>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-gray-500"></div>
            <div className="text-gray-500 text-center">Fast</div>
            <div className="text-gray-500 text-center">Medium</div>
            <div className="text-gray-500 text-center">Slow</div>
            <div className="text-gray-400">Rate</div>
            <div className="text-white text-center font-mono">{fees?.fast} sat/vB</div>
            <div className="text-white text-center font-mono">{fees?.medium} sat/vB</div>
            <div className="text-white text-center font-mono">{fees?.slow} sat/vB</div>
            <div className="text-gray-400">Unlock</div>
            <div className="text-gray-300 text-center font-mono">{feeDetail.estimates.unlockFee.fast}</div>
            <div className="text-gray-300 text-center font-mono">{feeDetail.estimates.unlockFee.medium}</div>
            <div className="text-gray-300 text-center font-mono">{feeDetail.estimates.unlockFee.slow}</div>
            <div className="text-gray-400">Send</div>
            <div className="text-gray-300 text-center font-mono">{feeDetail.estimates.sendFee.fast}</div>
            <div className="text-gray-300 text-center font-mono">{feeDetail.estimates.sendFee.medium}</div>
            <div className="text-gray-300 text-center font-mono">{feeDetail.estimates.sendFee.slow}</div>
            {utxos.length >= 2 && (<>
              <div className="text-gray-400">Consolidate</div>
              <div className="text-gray-300 text-center font-mono">{feeDetail.estimates.consolidateFee.fast}</div>
              <div className="text-gray-300 text-center font-mono">{feeDetail.estimates.consolidateFee.medium}</div>
              <div className="text-gray-300 text-center font-mono">{feeDetail.estimates.consolidateFee.slow}</div>
            </>)}
          </div>
        </div>
      )}

      {/* UTXOs + Consolidate */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-400 text-sm font-semibold">UTXOs ({utxos.length})</h3>
          {utxos.length >= 2 && (
            <button onClick={handleConsolidatePreview}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors">
              Consolidate at Low Fee
            </button>
          )}
        </div>
        {utxos.length === 0 ? (
          <p className="text-gray-600 text-sm">No UTXOs yet. Unlock payments will appear here.</p>
        ) : (
          <div className="space-y-1">
            {utxos.map(u => (
              <div key={`${u.txid}:${u.vout}`} className="flex items-center justify-between px-3 py-2 bg-gray-900/50 rounded-lg text-sm">
                <span className="text-orange-400 font-mono">{u.value.toLocaleString()} sats</span>
                <span className="text-gray-500 font-mono text-xs">{truncateAddr(u.address)}</span>
                <span className="text-gray-600 text-xs">{u.confirmations}+ conf</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consolidation detail */}
      {consolidateDetail && (
        <div className="bg-gray-900 rounded-xl p-4 mb-6 space-y-3">
          <h4 className="text-white font-semibold text-sm">Consolidation Preview</h4>
          <p className="text-gray-400 text-xs">Combine {consolidateDetail.inputs.length} UTXOs into 1 at the slow fee rate.</p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Total In</span>
            <span className="text-white font-mono">{consolidateDetail.totalIn.toLocaleString()} sats</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Fee</span>
            <span className="text-white font-mono">{consolidateDetail.fee.toLocaleString()} sats ({consolidateDetail.feeRate} sat/vB)</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Output</span>
            <span className="text-orange-400 font-mono">{consolidateDetail.totalOut.toLocaleString()} sats</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setConsolidateDetail(null)} className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
            <button onClick={handleConsolidate} disabled={sending}
              className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-500 disabled:opacity-50">
              {sending ? 'Broadcasting...' : 'Confirm Consolidation'}
            </button>
          </div>
        </div>
      )}

      {/* Send */}
      <div className="space-y-4">
        <h3 className="text-gray-400 text-sm font-semibold">Send</h3>
        <input type="text" value={sendAddress} onChange={e => setSendAddress(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-orange-500"
          placeholder="bc1q... or tb1q..." />
        <div className="flex gap-3">
          <input type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-orange-500" placeholder="Amount (sats)" />
          {fees && <select value={feeRate} onChange={e => setFeeRate(parseInt(e.target.value))}
            className="w-40 bg-gray-900 border border-gray-700 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-orange-500">
            <option value={fees.fast}>Fast ({fees.fast})</option>
            <option value={fees.medium}>Medium ({fees.medium})</option>
            <option value={fees.slow}>Slow ({fees.slow})</option>
          </select>}
        </div>
        {error && <p className="text-orange-400 text-sm">{error}</p>}
        {txResult && <p className="text-white text-sm font-mono break-all">Broadcast: {txResult}</p>}
        {!txDetail ? (
          <button onClick={handlePreview} className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors">Review Transaction</button>
        ) : (
          <div className="bg-gray-900 rounded-xl p-4 space-y-3">
            <h4 className="text-white font-semibold text-sm">Transaction Detail</h4>
            <div className="text-xs text-gray-400 space-y-1">
              {txDetail.inputs.map((inp, i) => <div key={i} className="font-mono">{inp.txid.slice(0, 16)}...:{inp.vout} ({inp.value.toLocaleString()} sats)</div>)}
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              {txDetail.outputs.map((out, i) => <div key={i} className="font-mono">{truncateAddr(out.address)} ({out.value.toLocaleString()} sats)</div>)}
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Fee</span>
              <span className="text-white font-mono">{txDetail.fee.toLocaleString()} sats ({txDetail.feeRate} sat/vB)</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTxDetail(null)} className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
              <button onClick={handleSend} disabled={sending}
                className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-500 disabled:opacity-50">
                {sending ? 'Broadcasting...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
