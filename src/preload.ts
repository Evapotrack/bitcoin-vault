import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('bitcoinVault', {
  // Password
  hasPassword: () => ipcRenderer.invoke('has-password'),
  setPassword: (password: string) => ipcRenderer.invoke('set-password', password),
  verifyPassword: (password: string) => ipcRenderer.invoke('verify-password', password),

  // Seed
  hasSeed: () => ipcRenderer.invoke('has-seed'),
  generateSeed: () => ipcRenderer.invoke('generate-seed'),
  storeSeed: (words: string[]) => ipcRenderer.invoke('store-seed', words),
  restoreSeed: (words: string[]) => ipcRenderer.invoke('restore-seed', words),
  verifyFirstAddresses: () => ipcRenderer.invoke('verify-first-addresses'),

  // Vault
  hasVault: () => ipcRenderer.invoke('has-vault'),
  createVault: (config: unknown) => ipcRenderer.invoke('create-vault', config),
  loadVault: () => ipcRenderer.invoke('load-vault'),
  saveVault: (index: unknown) => ipcRenderer.invoke('save-vault', index),

  // Files
  stageFiles: () => ipcRenderer.invoke('stage-files'),
  importFiles: (files: unknown) => ipcRenderer.invoke('import-files', files),
  openFile: (fileId: string) => ipcRenderer.invoke('open-file', fileId),
  deleteFile: (fileId: string) => ipcRenderer.invoke('delete-file', fileId),
  createFolder: (name: string, parentId: string | null) => ipcRenderer.invoke('create-folder', name, parentId),
  deleteFolder: (folderId: string) => ipcRenderer.invoke('delete-folder', folderId),

  // Bitcoin
  getUnlockAddress: () => ipcRenderer.invoke('get-unlock-address'),
  pollPayment: (address: string, amountSats: number) => ipcRenderer.invoke('poll-payment', address, amountSats),
  getBalance: () => ipcRenderer.invoke('get-balance'),
  getUtxos: () => ipcRenderer.invoke('get-utxos'),
  getFees: () => ipcRenderer.invoke('get-fees'),
  buildTransaction: (toAddress: string, amountSats: number, feeRate: number) =>
    ipcRenderer.invoke('build-transaction', toAddress, amountSats, feeRate),
  broadcastTransaction: (toAddress: string, amountSats: number, feeRate: number) =>
    ipcRenderer.invoke('broadcast-transaction', toAddress, amountSats, feeRate),

  // Settings
  updateSettings: (updates: { autoLockMinutes?: number; denomination?: string }) =>
    ipcRenderer.invoke('update-settings', updates),

  // Util
  touchActivity: () => ipcRenderer.invoke('touch-activity'),
  getNetworkType: () => ipcRenderer.invoke('get-network-type'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  copyToClipboard: (text: string) => ipcRenderer.invoke('copy-to-clipboard', text),
  clearClipboard: () => ipcRenderer.invoke('clear-clipboard'),
  lockVault: () => ipcRenderer.invoke('lock-vault'),
});

// Listen for auto-lock events from main process
ipcRenderer.on('vault-locked', () => {
  window.dispatchEvent(new CustomEvent('vault-locked'));
});
