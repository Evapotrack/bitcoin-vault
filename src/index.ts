import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as keychain from './keychain';
import * as wallet from './bitcoin/wallet';
import * as utxoModule from './bitcoin/utxo';
import * as feesModule from './bitcoin/fees';
import * as txModule from './bitcoin/transactions';
import * as vaultIndex from './vault/index';
import * as vaultFiles from './vault/files';
import type { VaultConfig, VaultIndex, NetworkType } from './types/vault';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// In-memory state (cleared on lock)
let currentSeed: Buffer | null = null;
let currentMasterKey: Buffer | null = null;
let currentNetworkType: NetworkType = 'testnet';
let currentVaultPath: string | null = null;
let currentIndex: VaultIndex | null = null;
let autoLockTimer: ReturnType<typeof setTimeout> | null = null;

function clearSensitiveState(): void {
  if (currentSeed) {
    currentSeed.fill(0);
    currentSeed = null;
  }
  if (currentMasterKey) {
    currentMasterKey.fill(0);
    currentMasterKey = null;
  }
  currentIndex = null;
  vaultFiles.cleanupTempFiles();
}

function resetAutoLock(minutes: number): void {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  if (minutes <= 0) return;
  autoLockTimer = setTimeout(() => {
    clearSensitiveState();
    BrowserWindow.getAllWindows().forEach(w => {
      w.webContents.send('vault-locked');
    });
  }, minutes * 60 * 1000);
}

function getDerivedAddresses(): Array<{ address: string; index: number }> {
  if (!currentSeed || !currentIndex) return [];
  const result: Array<{ address: string; index: number }> = [];
  for (let i = 0; i < currentIndex.addressIndex; i++) {
    result.push({ address: wallet.deriveAddress(currentSeed, i, currentNetworkType).address, index: i });
  }
  return result;
}

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#030712',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for preload to work with IPC
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Block external navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://') && !url.includes('webpack')) {
      event.preventDefault();
    }
  });

  // Block new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Dev tools in development only
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  clearSensitiveState();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  clearSensitiveState();
});

// ===== IPC HANDLERS =====

// Password
ipcMain.handle('has-password', () => keychain.hasPassword());
ipcMain.handle('set-password', (_e, password: string) => {
  keychain.setPassword(password);
});
ipcMain.handle('verify-password', (_e, password: string) => keychain.checkPassword(password));

// Seed
ipcMain.handle('has-seed', () => keychain.hasSeed());

ipcMain.handle('generate-seed', () => {
  const mnemonic = wallet.generateMnemonic();
  return mnemonic.split(' ');
});

ipcMain.handle('store-seed', async (_e, words: string[]) => {
  const mnemonic = words.join(' ');
  if (!wallet.validateMnemonic(mnemonic)) throw new Error('Invalid mnemonic');
  keychain.storeSeed(mnemonic);
});

ipcMain.handle('restore-seed', async (_e, words: string[]) => {
  const mnemonic = words.join(' ');
  if (!wallet.validateMnemonic(mnemonic)) return false;
  keychain.storeSeed(mnemonic);
  return true;
});

ipcMain.handle('verify-first-addresses', async () => {
  const mnemonic = keychain.getSeed();
  if (!mnemonic) throw new Error('No seed');
  const seed = await wallet.mnemonicToSeed(mnemonic);
  const addresses: string[] = [];
  for (let i = 0; i < 5; i++) {
    addresses.push(wallet.deriveAddress(seed, i, currentNetworkType).address);
  }
  seed.fill(0);
  return addresses;
});

// Vault
ipcMain.handle('has-vault', () => {
  if (!currentVaultPath) return false;
  return vaultIndex.hasVaultIndex(currentVaultPath);
});

ipcMain.handle('create-vault', async (_e, config: VaultConfig) => {
  currentNetworkType = config.networkType;
  currentVaultPath = config.vaultFolderPath;
  keychain.storeConfig(JSON.stringify(config));

  vaultIndex.createVaultDirectory(currentVaultPath);

  const mnemonic = keychain.getSeed();
  if (!mnemonic) throw new Error('No seed');
  const seed = await wallet.mnemonicToSeed(mnemonic);
  currentMasterKey = wallet.deriveMasterEncryptionKey(seed);
  currentSeed = seed;

  const idx = vaultIndex.createEmptyIndex(config);
  vaultIndex.saveIndex(idx, currentVaultPath, currentMasterKey);
  currentIndex = idx;
});

ipcMain.handle('load-vault', async () => {
  const configStr = keychain.getConfig();
  if (!configStr) throw new Error('No vault config');
  const config: VaultConfig = JSON.parse(configStr);

  currentNetworkType = config.networkType;
  currentVaultPath = config.vaultFolderPath;

  const mnemonic = keychain.getSeed();
  if (!mnemonic) throw new Error('No seed');
  const seed = await wallet.mnemonicToSeed(mnemonic);
  currentMasterKey = wallet.deriveMasterEncryptionKey(seed);
  currentSeed = seed;

  const idx = vaultIndex.loadIndex(currentVaultPath, currentMasterKey);
  if (!idx) throw new Error('Failed to decrypt vault index');
  currentIndex = idx;

  resetAutoLock(config.autoLockMinutes);
  return idx;
});

ipcMain.handle('save-vault', (_e, index: VaultIndex) => {
  if (!currentVaultPath || !currentMasterKey) throw new Error('Vault not open');
  vaultIndex.saveIndex(index, currentVaultPath, currentMasterKey);
  currentIndex = index;
});

// Files
ipcMain.handle('stage-files', async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
  });
  if (result.canceled) return [];
  return result.filePaths.map(p => ({
    path: p,
    name: path.basename(p),
    size: fs.statSync(p).size,
    deleteOriginal: false,
  }));
});

ipcMain.handle('import-files', (_e, files: Array<{ path: string; name: string; size: number; deleteOriginal: boolean }>) => {
  if (!currentVaultPath || !currentMasterKey || !currentIndex) throw new Error('Vault not open');

  for (const file of files) {
    const sizeCheck = vaultFiles.checkFileSize(file.size);
    if (sizeCheck === 'reject') throw new Error(`File too large: ${file.name}`);

    const fileId = vaultFiles.generateFileId();
    const { originalSize, compressedSize } = vaultFiles.importFile(
      file.path, fileId, currentVaultPath, currentMasterKey
    );

    currentIndex.files.push({
      id: fileId,
      name: file.name,
      folderId: null,
      originalSize,
      compressedSize,
      addedAt: Date.now(),
    });

    if (file.deleteOriginal) {
      vaultFiles.deleteOriginalSecurely(file.path);
    }
  }

  vaultIndex.saveIndex(currentIndex, currentVaultPath, currentMasterKey);
  return currentIndex;
});

ipcMain.handle('open-file', (_e, fileId: string) => {
  if (!currentVaultPath || !currentMasterKey || !currentIndex) throw new Error('Vault not open');
  const file = currentIndex.files.find(f => f.id === fileId);
  if (!file) throw new Error('File not found');
  vaultFiles.accessFile(fileId, file.name, currentVaultPath, currentMasterKey);
});

ipcMain.handle('delete-file', (_e, fileId: string) => {
  if (!currentVaultPath || !currentMasterKey || !currentIndex) throw new Error('Vault not open');
  vaultFiles.deleteEncryptedFile(fileId, currentVaultPath);
  currentIndex.files = currentIndex.files.filter(f => f.id !== fileId);
  vaultIndex.saveIndex(currentIndex, currentVaultPath, currentMasterKey);
  return currentIndex;
});

ipcMain.handle('create-folder', (_e, name: string, parentId: string | null) => {
  if (!currentVaultPath || !currentMasterKey || !currentIndex) throw new Error('Vault not open');
  const folderId = vaultFiles.generateFileId();
  currentIndex.folders.push({ id: folderId, name, parentId, createdAt: Date.now() });
  vaultIndex.saveIndex(currentIndex, currentVaultPath, currentMasterKey);
  return folderId;
});

ipcMain.handle('delete-folder', (_e, folderId: string) => {
  if (!currentVaultPath || !currentMasterKey || !currentIndex) throw new Error('Vault not open');
  // Delete all files in folder
  const filesToDelete = currentIndex.files.filter(f => f.folderId === folderId);
  for (const file of filesToDelete) {
    vaultFiles.deleteEncryptedFile(file.id, currentVaultPath);
  }
  currentIndex.files = currentIndex.files.filter(f => f.folderId !== folderId);
  // Delete subfolders recursively
  const deleteSubfolders = (pid: string) => {
    const subs = currentIndex!.folders.filter(f => f.parentId === pid);
    for (const sub of subs) {
      deleteSubfolders(sub.id);
    }
    currentIndex!.folders = currentIndex!.folders.filter(f => f.parentId !== pid);
  };
  deleteSubfolders(folderId);
  currentIndex.folders = currentIndex.folders.filter(f => f.id !== folderId);
  vaultIndex.saveIndex(currentIndex, currentVaultPath, currentMasterKey);
  return currentIndex;
});

// Bitcoin
ipcMain.handle('get-unlock-address', async () => {
  if (!currentSeed || !currentIndex) throw new Error('Vault not ready');
  const index = currentIndex.addressIndex;
  const { address } = wallet.deriveAddress(currentSeed, index, currentNetworkType);
  currentIndex.addressIndex = index + 1;
  if (currentVaultPath && currentMasterKey) {
    vaultIndex.saveIndex(currentIndex, currentVaultPath, currentMasterKey);
  }
  return { address, index };
});

ipcMain.handle('poll-payment', async (_e, address: string, amountSats: number) => {
  // Three mandatory checks enforced here in main process:
  const result = await utxoModule.checkPayment(address, amountSats, currentNetworkType);

  if (result.found && result.confirmed && result.txid) {
    // Check for replay
    if (currentIndex && currentIndex.usedTxids.includes(result.txid)) {
      return { confirmed: false, error: 'Transaction already used' };
    }
    // Record txid and address
    if (currentIndex) {
      currentIndex.usedTxids.push(result.txid);
      currentIndex.usedAddresses.push(address);
      if (currentVaultPath && currentMasterKey) {
        vaultIndex.saveIndex(currentIndex, currentVaultPath, currentMasterKey);
      }
    }
    return { confirmed: true, txid: result.txid };
  }

  return { confirmed: false, detected: result.found };
});

ipcMain.handle('get-balance', async () => {
  if (!currentSeed || !currentIndex) return 0;
  const addresses = getDerivedAddresses();
  return utxoModule.fetchBalance(addresses, currentNetworkType);
});

ipcMain.handle('get-utxos', async () => {
  if (!currentSeed || !currentIndex) return [];
  const addresses = getDerivedAddresses();
  return utxoModule.fetchAllUtxos(addresses, currentNetworkType);
});

ipcMain.handle('get-fees', async () => {
  return feesModule.fetchFeeEstimates(currentNetworkType);
});

ipcMain.handle('build-transaction', async (_e, toAddress: string, amountSats: number, feeRate: number) => {
  if (!currentSeed || !currentIndex) throw new Error('Vault not ready');

  if (!txModule.validateAddress(toAddress, currentNetworkType)) {
    throw new Error('Invalid address');
  }

  const addresses = getDerivedAddresses();
  const utxos = await utxoModule.fetchAllUtxos(addresses, currentNetworkType);

  const changeAddr = wallet.deriveChangeAddress(currentSeed, 0, currentNetworkType).address;
  const detail = txModule.buildTransactionDetail(utxos, toAddress, amountSats, feeRate, changeAddr, currentNetworkType);
  if (!detail) throw new Error('Insufficient funds');
  return detail;
});

ipcMain.handle('broadcast-transaction', async (_e, toAddress: string, amountSats: number, feeRate: number) => {
  if (!currentSeed || !currentIndex) throw new Error('Vault not ready');

  const addresses = getDerivedAddresses();
  const utxos = await utxoModule.fetchAllUtxos(addresses, currentNetworkType);
  const changeAddr = wallet.deriveChangeAddress(currentSeed, 0, currentNetworkType).address;

  // Create a copy of seed for signing (will be zeroed by signAndBroadcast)
  const seedCopy = Buffer.from(currentSeed);
  const txid = await txModule.signAndBroadcast(
    utxos, toAddress, amountSats, feeRate, changeAddr,
    seedCopy, currentIndex.addressIndex, currentNetworkType
  );
  return txid;
});

// Util
ipcMain.handle('get-network-type', () => currentNetworkType);

ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('copy-to-clipboard', (_e, text: string) => {
  clipboard.writeText(text);
  // Auto-clear after 60 seconds
  setTimeout(() => {
    if (clipboard.readText() === text) {
      clipboard.clear();
    }
  }, 60000);
});

ipcMain.handle('clear-clipboard', () => {
  clipboard.clear();
});

ipcMain.handle('lock-vault', () => {
  clipboard.clear();
  clearSensitiveState();
});

ipcMain.handle('touch-activity', () => {
  if (currentIndex) {
    resetAutoLock(currentIndex.settings.autoLockMinutes);
  }
});
