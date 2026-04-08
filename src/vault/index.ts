import * as fs from 'fs';
import * as path from 'path';
import type { VaultIndex, VaultConfig } from '../types/vault';
import { encryptIndex, decryptIndex } from './encryption';

const INDEX_FILENAME = 'vault.index.enc';
const FILES_DIR = 'files';

export function createVaultDirectory(folderPath: string): void {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  const filesDir = path.join(folderPath, FILES_DIR);
  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir);
  }
}

export function createEmptyIndex(config: VaultConfig): VaultIndex {
  return {
    version: 1,
    files: [],
    folders: [],
    settings: config,
    usedTxids: [],
    usedAddresses: [],
    addressIndex: 0,
  };
}

export function saveIndex(index: VaultIndex, folderPath: string, masterKey: Buffer): void {
  const json = JSON.stringify(index);
  const encrypted = encryptIndex(json, masterKey);
  const indexPath = path.join(folderPath, INDEX_FILENAME);
  fs.writeFileSync(indexPath, encrypted);
}

export function loadIndex(folderPath: string, masterKey: Buffer): VaultIndex | null {
  const indexPath = path.join(folderPath, INDEX_FILENAME);
  if (!fs.existsSync(indexPath)) return null;

  try {
    const encrypted = fs.readFileSync(indexPath);
    const json = decryptIndex(encrypted, masterKey);
    return JSON.parse(json) as VaultIndex;
  } catch {
    return null;
  }
}

export function hasVaultIndex(folderPath: string): boolean {
  return fs.existsSync(path.join(folderPath, INDEX_FILENAME));
}

export function getFilesDir(folderPath: string): string {
  return path.join(folderPath, FILES_DIR);
}
