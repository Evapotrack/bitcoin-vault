import { create } from 'zustand';
import type { AppView, VaultIndex, VaultFile, VaultFolder, UTXO, Denomination, NetworkType } from '../types/vault';

interface VaultState {
  // App state
  view: AppView;
  isUnlocked: boolean;
  isSetupComplete: boolean;
  networkType: NetworkType;
  denomination: Denomination;

  // Vault data (only populated when unlocked)
  vaultIndex: VaultIndex | null;
  currentFolderId: string | null;

  // Bitcoin
  balance: number;
  utxos: UTXO[];
  unlockAddress: string | null;
  unlockAmount: number;
  paymentStatus: 'idle' | 'waiting' | 'detected' | 'confirmed' | 'error';
  paymentError: string | null;

  // Auto-lock
  autoLockMinutes: number;
  lastActivity: number;

  // Actions
  setView: (view: AppView) => void;
  setUnlocked: (unlocked: boolean) => void;
  setSetupComplete: (complete: boolean) => void;
  setNetworkType: (network: NetworkType) => void;
  setDenomination: (denom: Denomination) => void;
  setVaultIndex: (index: VaultIndex | null) => void;
  setCurrentFolder: (folderId: string | null) => void;
  setBalance: (balance: number) => void;
  setUtxos: (utxos: UTXO[]) => void;
  setUnlockAddress: (address: string | null) => void;
  setUnlockAmount: (amount: number) => void;
  setPaymentStatus: (status: VaultState['paymentStatus']) => void;
  setPaymentError: (error: string | null) => void;
  setAutoLockMinutes: (minutes: number) => void;
  touchActivity: () => void;
  lockVault: () => void;

  // Computed helpers
  currentFiles: () => VaultFile[];
  currentFolders: () => VaultFolder[];
  formatAmount: (sats: number) => string;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  view: 'setup',
  isUnlocked: false,
  isSetupComplete: false,
  networkType: 'testnet',
  denomination: 'sats',
  vaultIndex: null,
  currentFolderId: null,
  balance: 0,
  utxos: [],
  unlockAddress: null,
  unlockAmount: 750,
  paymentStatus: 'idle',
  paymentError: null,
  autoLockMinutes: 15,
  lastActivity: Date.now(),

  setView: (view) => set({ view }),
  setUnlocked: (isUnlocked) => set({ isUnlocked }),
  setSetupComplete: (isSetupComplete) => set({ isSetupComplete }),
  setNetworkType: (networkType) => set({ networkType }),
  setDenomination: (denomination) => set({ denomination }),
  setVaultIndex: (vaultIndex) => set({ vaultIndex }),
  setCurrentFolder: (currentFolderId) => set({ currentFolderId }),
  setBalance: (balance) => set({ balance }),
  setUtxos: (utxos) => set({ utxos }),
  setUnlockAddress: (unlockAddress) => set({ unlockAddress }),
  setUnlockAmount: (unlockAmount) => set({ unlockAmount }),
  setPaymentStatus: (paymentStatus) => set({ paymentStatus }),
  setPaymentError: (paymentError) => set({ paymentError }),
  setAutoLockMinutes: (autoLockMinutes) => set({ autoLockMinutes }),
  touchActivity: () => set({ lastActivity: Date.now() }),

  lockVault: () => set({
    isUnlocked: false,
    vaultIndex: null,
    currentFolderId: null,
    balance: 0,
    utxos: [],
    unlockAddress: null,
    paymentStatus: 'idle',
    paymentError: null,
    view: 'lock',
  }),

  currentFiles: () => {
    const { vaultIndex, currentFolderId } = get();
    if (!vaultIndex) return [];
    return vaultIndex.files.filter(f => f.folderId === currentFolderId);
  },

  currentFolders: () => {
    const { vaultIndex, currentFolderId } = get();
    if (!vaultIndex) return [];
    return vaultIndex.folders.filter(f => f.parentId === currentFolderId);
  },

  formatAmount: (sats) => {
    const { denomination } = get();
    if (denomination === 'btc') {
      return `${(sats / 100_000_000).toFixed(8)} BTC`;
    }
    return `${sats.toLocaleString()} sats`;
  },
}));
