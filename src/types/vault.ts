export type NetworkType = 'testnet' | 'mainnet';
export type Denomination = 'sats' | 'btc';
export type UnlockFrequency = 'per-session' | 'daily' | 'weekly' | 'monthly';

export interface VaultConfig {
  networkType: NetworkType;
  unlockCostSats: number;
  unlockFrequency: UnlockFrequency;
  vaultFolderPath: string;
  autoLockMinutes: number;
  denomination: Denomination;
}

export interface VaultFile {
  id: string;
  name: string;
  folderId: string | null;
  originalSize: number;
  compressedSize: number;
  addedAt: number;
  protectionCostSats?: number;
  protectionFrequency?: UnlockFrequency;
}

export interface VaultFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

export interface VaultIndex {
  version: number;
  files: VaultFile[];
  folders: VaultFolder[];
  settings: VaultConfig;
  usedTxids: string[];
  usedAddresses: string[];
  addressIndex: number;
}

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  address: string;
  confirmations: number;
  label?: string;
}

export interface TransactionDetail {
  inputs: Array<{ txid: string; vout: number; value: number }>;
  outputs: Array<{ address: string; value: number }>;
  fee: number;
  feeRate: number;
  totalIn: number;
  totalOut: number;
}

export type AppView = 'setup' | 'lock' | 'vault' | 'wallet' | 'settings' | 'howto';

export interface StagedFile {
  path: string;
  name: string;
  size: number;
  deleteOriginal: boolean;
}
