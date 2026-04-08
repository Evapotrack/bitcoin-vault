import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useVaultStore } from '../store/vaultStore';
import { HelpLink } from './HelpLink';
import type { UnlockFrequency, VaultIndex } from '../types/vault';

type PaymentStatus = 'loading' | 'waiting' | 'detected' | 'confirmed';

export function VaultBrowser() {
  const { vaultIndex, setVaultIndex, currentFolderId, setCurrentFolder, currentFiles, currentFolders } = useVaultStore();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);
  const [protectTarget, setProtectTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string; currentCost?: number; currentFreq?: string } | null>(null);
  const [protectCost, setProtectCost] = useState('');
  const [protectFreq, setProtectFreq] = useState<UnlockFrequency>('per-session');
  const [importing, setImporting] = useState(false);
  const [deletionCostTarget, setDeletionCostTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string; currentCost?: number } | null>(null);
  const [deletionCostInput, setDeletionCostInput] = useState('');

  // Protection payment flow
  const [accessPayment, setAccessPayment] = useState<{ fileId: string; name: string; costSats: number; frequency: string; address: string } | null>(null);
  const [accessStatus, setAccessStatus] = useState<PaymentStatus>('loading');
  const accessPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Deletion payment flow
  const [deletionPayment, setDeletionPayment] = useState<{ fileId: string; name: string; costSats: number; address: string } | null>(null);
  const [deletionStatus, setDeletionStatus] = useState<PaymentStatus>('loading');
  const deletionPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const files = currentFiles();
  const folders = currentFolders();

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (accessPollRef.current) clearInterval(accessPollRef.current);
      if (deletionPollRef.current) clearInterval(deletionPollRef.current);
    };
  }, []);

  const handleAddFiles = async () => {
    setImporting(true);
    try {
      const staged = await window.bitcoinVault.stageFiles();
      if (staged.length === 0) { setImporting(false); return; }
      const updated = await window.bitcoinVault.importFiles(staged);
      setVaultIndex(updated);
    } catch { /* ignore */ }
    setImporting(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await window.bitcoinVault.createFolder(newFolderName.trim(), currentFolderId);
    const updated = await window.bitcoinVault.loadVault();
    setVaultIndex(updated);
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const [deletionBlocked, setDeletionBlocked] = useState<{ name: string; costSats: number; fileId: string } | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'file') {
      const result = await window.bitcoinVault.deleteFile(deleteTarget.id) as { deletionRequired?: boolean; costSats?: number } | VaultIndex;
      if ('deletionRequired' in result && result.deletionRequired) {
        setDeleteTarget(null);
        setDeletionBlocked({ name: deleteTarget.name, costSats: result.costSats!, fileId: deleteTarget.id });
        return;
      }
      setVaultIndex(result as VaultIndex);
    } else {
      const updated = await window.bitcoinVault.deleteFolder(deleteTarget.id);
      setVaultIndex(updated);
    }
    setDeleteTarget(null);
  };

  const handleSetProtection = async () => {
    if (!protectTarget) return;
    const cost = protectCost ? parseInt(protectCost) : null;
    const freq = cost ? protectFreq : null;
    if (protectTarget.type === 'file') {
      const updated = await window.bitcoinVault.setFileProtection(protectTarget.id, cost, freq);
      if (updated) setVaultIndex(updated);
    } else {
      const updated = await window.bitcoinVault.setFolderProtection(protectTarget.id, cost, freq);
      if (updated) setVaultIndex(updated);
    }
    setProtectTarget(null);
    setProtectCost('');
  };

  const openProtectDialog = (type: 'file' | 'folder', id: string, name: string, cost?: number, freq?: string) => {
    setProtectTarget({ type, id, name, currentCost: cost, currentFreq: freq });
    setProtectCost(cost ? String(cost) : '');
    setProtectFreq((freq as UnlockFrequency) || 'per-session');
  };

  const handleSetDeletionCost = async () => {
    if (!deletionCostTarget || !deletionCostInput) return;
    const cost = parseInt(deletionCostInput);
    if (isNaN(cost) || cost < 1500) return;
    try {
      if (deletionCostTarget.type === 'file') {
        const updated = await window.bitcoinVault.setFileDeletionCost(deletionCostTarget.id, cost);
        if (updated) setVaultIndex(updated);
      } else {
        const updated = await window.bitcoinVault.setFolderDeletionCost(deletionCostTarget.id, cost);
        if (updated) setVaultIndex(updated);
      }
    } catch { /* ignore */ }
    setDeletionCostTarget(null);
    setDeletionCostInput('');
  };

  // --- Protection Payment Flow ---
  const startAccessPayment = async (fileId: string, name: string, costSats: number, frequency: string) => {
    setAccessStatus('loading');
    try {
      const { address } = await window.bitcoinVault.getProtectionAddress(fileId);
      setAccessPayment({ fileId, name, costSats, frequency, address });
      setAccessStatus('waiting');
      startAccessPolling(address, costSats, fileId);
    } catch { /* ignore */ }
  };

  const startAccessPolling = (address: string, amount: number, fileId: string) => {
    if (accessPollRef.current) clearInterval(accessPollRef.current);
    const poll = async () => {
      try {
        window.bitcoinVault.touchActivity();
        const result = await window.bitcoinVault.pollProtectionPayment(address, amount);
        if (result.confirmed && result.txid) {
          if (accessPollRef.current) clearInterval(accessPollRef.current);
          setAccessStatus('confirmed');
          await window.bitcoinVault.confirmProtectionAccess(fileId, result.txid);
          setTimeout(() => {
            setAccessPayment(null);
            setAccessStatus('loading');
          }, 2500);
        } else if (result.detected) {
          setAccessStatus('detected');
        }
      } catch { /* ignore polling errors */ }
    };
    poll();
    accessPollRef.current = setInterval(poll, 15000);
  };

  const closeAccessPayment = () => {
    if (accessPollRef.current) clearInterval(accessPollRef.current);
    setAccessPayment(null);
    setAccessStatus('loading');
  };

  // --- Deletion Payment Flow ---
  const startDeletionPayment = async (fileId: string, name: string, costSats: number) => {
    setDeletionStatus('loading');
    setDeletionBlocked(null);
    try {
      const { address } = await window.bitcoinVault.getDeletionAddress(fileId);
      setDeletionPayment({ fileId, name, costSats, address });
      setDeletionStatus('waiting');
      startDeletionPolling(address, costSats, fileId);
    } catch { /* ignore */ }
  };

  const startDeletionPolling = (address: string, amount: number, fileId: string) => {
    if (deletionPollRef.current) clearInterval(deletionPollRef.current);
    const poll = async () => {
      try {
        window.bitcoinVault.touchActivity();
        const result = await window.bitcoinVault.pollDeletionPayment(address, amount);
        if (result.confirmed && result.txid) {
          if (deletionPollRef.current) clearInterval(deletionPollRef.current);
          setDeletionStatus('confirmed');
          const updated = await window.bitcoinVault.confirmDeletion(fileId, result.txid);
          setVaultIndex(updated);
          setTimeout(() => {
            setDeletionPayment(null);
            setDeletionStatus('loading');
          }, 2500);
        } else if (result.detected) {
          setDeletionStatus('detected');
        }
      } catch { /* ignore polling errors */ }
    };
    poll();
    deletionPollRef.current = setInterval(poll, 15000);
  };

  const closeDeletionPayment = () => {
    if (deletionPollRef.current) clearInterval(deletionPollRef.current);
    setDeletionPayment(null);
    setDeletionStatus('loading');
  };

  const navigateUp = () => {
    if (!currentFolderId || !vaultIndex) { setCurrentFolder(null); return; }
    const folder = vaultIndex.folders.find(f => f.id === currentFolderId);
    setCurrentFolder(folder?.parentId ?? null);
  };

  const breadcrumb = () => {
    if (!vaultIndex || !currentFolderId) return 'Vault';
    const parts: string[] = [];
    let id: string | null = currentFolderId;
    while (id) {
      const f = vaultIndex.folders.find(fo => fo.id === id);
      if (!f) break;
      parts.unshift(f.name);
      id = f.parentId;
    }
    return 'Vault / ' + parts.join(' / ');
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const deletionBadge = (cost?: number) => {
    if (!cost) return null;
    return (
      <span className="text-gray-500 text-xs font-mono">
        {cost.toLocaleString()} sats/delete
      </span>
    );
  };

  const protectionBadge = (cost?: number, freq?: string) => {
    if (!cost) return null;
    return (
      <span className="text-orange-400 text-xs font-mono">
        {cost.toLocaleString()} sats/{freq?.replace('-', ' ')}
      </span>
    );
  };

  const copyAddress = async (address: string) => {
    await window.bitcoinVault.copyToClipboard(address);
  };

  const renderPaymentStates = (status: PaymentStatus) => (
    <div className="text-sm">
      {status === 'waiting' && <span className="text-gray-400">Waiting for payment...</span>}
      {status === 'detected' && (
        <div className="space-y-3">
          <span className="text-orange-400">Transaction detected. Waiting for confirmation...</span>
          <div className="flex justify-center gap-3 pt-1">
            <span className="w-5 h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }} />
            <span className="w-5 h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }} />
            <span className="w-5 h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.8s' }} />
          </div>
        </div>
      )}
      {status === 'confirmed' && (
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-orange-600/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span className="text-white font-semibold">Confirmed</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {currentFolderId && (
            <button onClick={navigateUp} className="text-gray-400 hover:text-white transition-colors text-sm">&larr; Back</button>
          )}
          <h2 className="text-lg font-semibold text-white">{breadcrumb()}</h2>
          <HelpLink />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowNewFolder(true)} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">New Folder</button>
          <button onClick={handleAddFiles} disabled={importing}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
            {importing ? 'Importing...' : 'Add Files'}
          </button>
        </div>
      </div>

      {/* New folder */}
      {showNewFolder && (
        <div className="mb-4 flex gap-2">
          <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} placeholder="Folder name"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" autoFocus />
          <button onClick={handleCreateFolder} className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm">Create</button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="px-3 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm">Cancel</button>
        </div>
      )}

      {/* List */}
      {folders.length === 0 && files.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg mb-2">Vault is empty</p>
          <p className="text-sm">Add files or create folders to get started.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {folders.map(folder => (
            <div key={folder.id}
              className="flex items-center justify-between px-4 py-3 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors group"
              onClick={() => setCurrentFolder(folder.id)}>
              <div className="flex items-center gap-3">
                <span className="text-orange-400 text-lg">&#128193;</span>
                <span className="text-white text-sm">{folder.name}</span>
                {protectionBadge(folder.protectionCostSats, folder.protectionFrequency)}
                {deletionBadge(folder.deletionCostSats)}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); openProtectDialog('folder', folder.id, folder.name, folder.protectionCostSats, folder.protectionFrequency); }}
                  className="text-gray-600 hover:text-orange-400 text-xs">Protect</button>
                {!folder.deletionCostSats && (
                  <button onClick={e => { e.stopPropagation(); setDeletionCostTarget({ type: 'folder', id: folder.id, name: folder.name }); setDeletionCostInput(''); }}
                    className="text-gray-600 hover:text-orange-400 text-xs">Lock Delete</button>
                )}
                <button onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'folder', id: folder.id, name: folder.name }); }}
                  className="text-gray-600 hover:text-white text-xs">Delete</button>
              </div>
            </div>
          ))}

          {files.map(file => (
            <div key={file.id}
              className="flex items-center justify-between px-4 py-3 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors group"
              onDoubleClick={async () => {
                const result = await window.bitcoinVault.openFile(file.id) as { protected?: boolean; costSats?: number; frequency?: string } | undefined;
                if (result && result.protected) {
                  startAccessPayment(file.id, file.name, result.costSats!, result.frequency!);
                }
              }}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-gray-400 text-lg">&#128196;</span>
                <span className="text-white text-sm truncate">{file.name}</span>
                {protectionBadge(file.protectionCostSats, file.protectionFrequency)}
                {deletionBadge(file.deletionCostSats)}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-xs">{formatSize(file.originalSize)}</span>
                <span className="text-gray-600 text-xs">{new Date(file.addedAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); openProtectDialog('file', file.id, file.name, file.protectionCostSats, file.protectionFrequency); }}
                    className="text-gray-600 hover:text-orange-400 text-xs">Protect</button>
                  {!file.deletionCostSats && (
                    <button onClick={e => { e.stopPropagation(); setDeletionCostTarget({ type: 'file', id: file.id, name: file.name }); setDeletionCostInput(''); }}
                      className="text-gray-600 hover:text-orange-400 text-xs">Lock Delete</button>
                  )}
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'file', id: file.id, name: file.name }); }}
                    className="text-gray-600 hover:text-white text-xs">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete overlay */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-white font-semibold text-lg">Delete {deleteTarget.type}?</h3>
            <p className="text-gray-400 text-sm">&quot;{deleteTarget.name}&quot; will be permanently deleted.
              {deleteTarget.type === 'folder' && ' All files inside will also be deleted.'}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-gray-700 text-white rounded-lg text-sm font-semibold hover:bg-gray-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Protection overlay */}
      {protectTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-white font-semibold text-lg">Set Protection</h3>
            <p className="text-gray-400 text-sm">&quot;{protectTarget.name}&quot; — additional payment required to access.</p>
            <div>
              <label className="text-gray-400 text-xs">Cost (sats, min 1,500)</label>
              <input type="number" value={protectCost} onChange={e => setProtectCost(e.target.value)} min={750}
                placeholder="e.g. 2000"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-gray-400 text-xs">Frequency</label>
              <select value={protectFreq} onChange={e => setProtectFreq(e.target.value as UnlockFrequency)}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                <option value="per-session">Per Session</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {protectTarget.currentCost ? (
              <div className="space-y-3">
                <div className="px-3 py-2 bg-gray-800 rounded-lg text-gray-400 text-xs text-center">
                  Protection is permanent once set and cannot be removed.
                </div>
                <button onClick={() => { setProtectTarget(null); setProtectCost(''); }} className="w-full py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Close</button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => { setProtectTarget(null); setProtectCost(''); }} className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
                <button onClick={handleSetProtection} className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-500">Set</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Set deletion cost overlay */}
      {deletionCostTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-white font-semibold text-lg">Lock Deletion</h3>
            <p className="text-gray-400 text-sm">&quot;{deletionCostTarget.name}&quot; — require Bitcoin payment to delete. This is permanent.</p>
            <div>
              <label className="text-gray-400 text-xs">Cost (sats, min 1,500)</label>
              <input type="number" value={deletionCostInput} onChange={e => setDeletionCostInput(e.target.value)} min={1500}
                placeholder="e.g. 2000"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setDeletionCostTarget(null); setDeletionCostInput(''); }} className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
              <button onClick={handleSetDeletionCost} className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-500">Set</button>
            </div>
          </div>
        </div>
      )}

      {/* Access payment overlay — protected file */}
      {accessPayment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4 text-center">
            <h3 className="text-white font-semibold text-lg">Protected File</h3>
            <p className="text-gray-400 text-sm">
              &quot;{accessPayment.name}&quot; requires payment to access.
            </p>
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG value={`bitcoin:${accessPayment.address}?amount=${(accessPayment.costSats / 100_000_000).toFixed(8)}`}
                  size={180} level="M" title={`Pay ${accessPayment.costSats} sats to access`} />
              </div>
            </div>
            <div onClick={() => copyAddress(accessPayment.address)}
              className="font-mono text-xs text-gray-300 break-all cursor-pointer hover:text-white transition-colors px-2" title="Click to copy">
              {accessPayment.address}
            </div>
            <div className="text-orange-400 font-mono text-xl font-bold">
              Send {accessPayment.costSats.toLocaleString()} sats
            </div>
            <p className="text-gray-500 text-xs">{accessPayment.frequency.replace('-', ' ')}</p>
            {renderPaymentStates(accessStatus)}
            {accessStatus !== 'confirmed' && (
              <button onClick={closeAccessPayment}
                className="w-full py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
            )}
          </div>
        </div>
      )}

      {/* Deletion blocked — start payment flow */}
      {deletionBlocked && !deletionPayment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4 text-center">
            <h3 className="text-white font-semibold text-lg">Deletion Protected</h3>
            <p className="text-gray-400 text-sm">
              &quot;{deletionBlocked.name}&quot; requires a Bitcoin payment to delete.
            </p>
            <div className="text-orange-400 font-mono text-2xl font-bold">
              {deletionBlocked.costSats.toLocaleString()} sats
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeletionBlocked(null)}
                className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
              <button onClick={() => startDeletionPayment(deletionBlocked.fileId, deletionBlocked.name, deletionBlocked.costSats)}
                className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-500">Pay to Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion payment overlay */}
      {deletionPayment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4 text-center">
            <h3 className="text-white font-semibold text-lg">Delete &quot;{deletionPayment.name}&quot;</h3>
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG value={`bitcoin:${deletionPayment.address}?amount=${(deletionPayment.costSats / 100_000_000).toFixed(8)}`}
                  size={180} level="M" title={`Pay ${deletionPayment.costSats} sats to delete`} />
              </div>
            </div>
            <div onClick={() => copyAddress(deletionPayment.address)}
              className="font-mono text-xs text-gray-300 break-all cursor-pointer hover:text-white transition-colors px-2" title="Click to copy">
              {deletionPayment.address}
            </div>
            <div className="text-orange-400 font-mono text-xl font-bold">
              Send {deletionPayment.costSats.toLocaleString()} sats
            </div>
            <p className="text-gray-500 text-xs">File will be permanently deleted after confirmation</p>
            {renderPaymentStates(deletionStatus)}
            {deletionStatus !== 'confirmed' && (
              <button onClick={closeDeletionPayment}
                className="w-full py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
