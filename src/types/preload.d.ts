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
  openFile(fileId: string): Promise<{ protected: boolean; costSats?: number; frequency?: string } | void>;
  deleteFile(fileId: string): Promise<VaultIndex>;
  createFolder(name: string, parentId: string | null): Promise<string>;
  deleteFolder(folderId: string): Promise<VaultIndex>;

  // Protection
  setFileProtection(fileId: string, costSats: number | null, frequency: string | null): Promise<VaultIndex>;
  setFolderProtection(folderId: string, costSats: number | null, frequency: string | null): Promise<VaultIndex>;

  // Bitcoin
  getUnlockAddress(): Promise<{ address: string; index: number }>;
  pollPayment(address: string, amountSats: number): Promise<{ confirmed: boolean; detected?: boolean; txid?: string }>;
  getBalance(): Promise<number>;
  getUtxos(): Promise<UTXO[]>;
  getFees(): Promise<{ fast: number; medium: number; slow: number }>;
  buildTransaction(toAddress: string, amountSats: number, feeRate: number): Promise<TransactionDetail>;
  broadcastTransaction(toAddress: string, amountSats: number, feeRate: number): Promise<string>;

  // Deletion Cost
  setFileDeletionCost(fileId: string, costSats: number): Promise<VaultIndex>;
  setFolderDeletionCost(folderId: string, costSats: number): Promise<VaultIndex>;

  // Consolidation
  buildConsolidation(feeRate: number): Promise<TransactionDetail>;
  broadcastConsolidation(feeRate: number): Promise<string>;

  // Dead Man's Switch
  configureDeadManSwitch(config: { enabled: boolean; countdownDays: number; proofOfLifeCostSats: number }): Promise<unknown>;
  getDeadManSwitchStatus(): Promise<{ enabled: boolean; expired: boolean; daysRemaining: number; countdownDays?: number; proofOfLifeCostSats?: number }>;
  proofOfLifeConfirmed(): Promise<void>;
  checkDeadManBypass(): Promise<boolean>;

  // Protection/Deletion Payment
  getProtectionAddress(fileId: string): Promise<{ address: string; costSats: number }>;
  pollProtectionPayment(address: string, amountSats: number): Promise<{ confirmed: boolean; detected?: boolean; txid?: string }>;
  confirmProtectionAccess(fileId: string, txid: string): Promise<void>;
  getDeletionAddress(fileId: string): Promise<{ address: string; costSats: number }>;
  pollDeletionPayment(address: string, amountSats: number): Promise<{ confirmed: boolean; detected?: boolean; txid?: string }>;
  confirmDeletion(fileId: string, txid: string): Promise<VaultIndex>;

  // Fee Estimation
  getFeeEstimateDetail(): Promise<{
    rates: { fast: number; medium: number; slow: number };
    estimates: {
      unlockFee: { fast: number; medium: number; slow: number };
      sendFee: { fast: number; medium: number; slow: number };
      consolidateFee: { fast: number; medium: number; slow: number };
    };
  }>;

  // Settings
  updateSettings(updates: { autoLockMinutes?: number; denomination?: string; unlockCostSats?: number }): Promise<void>;

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
