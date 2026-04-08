import type { NetworkType, VaultConfig, VaultIndex, UTXO, TransactionDetail, StagedFile } from './vault';

export interface BitcoinVaultAPI {
  // Password
  hasPassword(): Promise<boolean>;
  setPassword(password: string): Promise<void>;
  verifyPassword(password: string): Promise<boolean>;

  // Seed
  hasSeed(): Promise<boolean>;
  generateSeed(): Promise<string[]>;
  storeSeed(words: string[]): Promise<void>;
  restoreSeed(words: string[]): Promise<boolean>;
  verifyFirstAddresses(): Promise<string[]>;

  // Vault
  hasVault(): Promise<boolean>;
  createVault(config: VaultConfig): Promise<void>;
  loadVault(): Promise<VaultIndex>;
  saveVault(index: VaultIndex): Promise<void>;

  // Files
  stageFiles(): Promise<StagedFile[]>;
  importFiles(files: StagedFile[]): Promise<VaultIndex>;
  openFile(fileId: string): Promise<void>;
  deleteFile(fileId: string): Promise<VaultIndex>;
  createFolder(name: string, parentId: string | null): Promise<string>;
  deleteFolder(folderId: string): Promise<VaultIndex>;

  // Bitcoin
  getUnlockAddress(): Promise<{ address: string; index: number }>;
  pollPayment(address: string, amountSats: number): Promise<{ confirmed: boolean; detected?: boolean; txid?: string }>;
  getBalance(): Promise<number>;
  getUtxos(): Promise<UTXO[]>;
  getFees(): Promise<{ fast: number; medium: number; slow: number }>;
  buildTransaction(toAddress: string, amountSats: number, feeRate: number): Promise<TransactionDetail>;
  broadcastTransaction(toAddress: string, amountSats: number, feeRate: number): Promise<string>;

  // Settings
  updateSettings(updates: { autoLockMinutes?: number; denomination?: string }): Promise<void>;

  // Util
  touchActivity(): Promise<void>;
  getNetworkType(): Promise<NetworkType>;
  selectFolder(): Promise<string | null>;
  copyToClipboard(text: string): Promise<void>;
  clearClipboard(): Promise<void>;
  lockVault(): Promise<void>;
}

declare global {
  interface Window {
    bitcoinVault: BitcoinVaultAPI;
  }
}
