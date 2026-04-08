import React, { useState } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { HelpLink } from './HelpLink';
import type { UnlockFrequency } from '../types/vault';

export function VaultBrowser() {
  const { vaultIndex, setVaultIndex, currentFolderId, setCurrentFolder, currentFiles, currentFolders } = useVaultStore();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);
  const [protectTarget, setProtectTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string; currentCost?: number; currentFreq?: string } | null>(null);
  const [protectCost, setProtectCost] = useState('');
  const [protectFreq, setProtectFreq] = useState<UnlockFrequency>('per-session');
  const [importing, setImporting] = useState(false);

  const files = currentFiles();
  const folders = currentFolders();

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'file') {
      const updated = await window.bitcoinVault.deleteFile(deleteTarget.id);
      setVaultIndex(updated);
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

  const handleClearProtection = async () => {
    if (!protectTarget) return;
    if (protectTarget.type === 'file') {
      const updated = await window.bitcoinVault.setFileProtection(protectTarget.id, null, null);
      if (updated) setVaultIndex(updated);
    } else {
      const updated = await window.bitcoinVault.setFolderProtection(protectTarget.id, null, null);
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

  const protectionBadge = (cost?: number, freq?: string) => {
    if (!cost) return null;
    return (
      <span className="text-orange-400 text-xs font-mono">
        {cost.toLocaleString()} sats/{freq?.replace('-', ' ')}
      </span>
    );
  };

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
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); openProtectDialog('folder', folder.id, folder.name, folder.protectionCostSats, folder.protectionFrequency); }}
                  className="text-gray-600 hover:text-orange-400 text-xs">Protect</button>
                <button onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'folder', id: folder.id, name: folder.name }); }}
                  className="text-gray-600 hover:text-white text-xs">Delete</button>
              </div>
            </div>
          ))}

          {files.map(file => (
            <div key={file.id}
              className="flex items-center justify-between px-4 py-3 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors group"
              onDoubleClick={() => window.bitcoinVault.openFile(file.id)}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-gray-400 text-lg">&#128196;</span>
                <span className="text-white text-sm truncate">{file.name}</span>
                {protectionBadge(file.protectionCostSats, file.protectionFrequency)}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-xs">{formatSize(file.originalSize)}</span>
                <span className="text-gray-600 text-xs">{new Date(file.addedAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); openProtectDialog('file', file.id, file.name, file.protectionCostSats, file.protectionFrequency); }}
                    className="text-gray-600 hover:text-orange-400 text-xs">Protect</button>
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
              <label className="text-gray-400 text-xs">Cost (sats, min 750)</label>
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
            <div className="flex gap-3">
              <button onClick={() => { setProtectTarget(null); setProtectCost(''); }} className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
              {protectTarget.currentCost && (
                <button onClick={handleClearProtection} className="py-2 px-3 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700">Remove</button>
              )}
              <button onClick={handleSetProtection} className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-500">Set</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
