import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { app, shell } from 'electron';
import type { VaultFile } from '../types/vault';
import { encryptData, decryptData, deriveFileKey, secureDelete } from './encryption';
import { getFilesDir } from './index';

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB
const WARN_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

// Secure temp directory inside app userData (not /tmp)
function getTempDir(): string {
  const tempDir = path.join(app.getPath('userData'), 'vault-temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { mode: 0o700 });
  }
  return tempDir;
}

export function generateFileId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function importFile(
  sourcePath: string,
  fileId: string,
  vaultFolderPath: string,
  masterKey: Buffer
): { originalSize: number; compressedSize: number } {
  const data = fs.readFileSync(sourcePath);

  if (data.length > MAX_FILE_SIZE) {
    throw new Error(`File exceeds 1 GB limit: ${data.length} bytes`);
  }

  const fileKey = deriveFileKey(masterKey, fileId);
  const encrypted = encryptData(data, fileKey);

  const destPath = path.join(getFilesDir(vaultFolderPath), `${fileId}.enc`);
  fs.writeFileSync(destPath, encrypted);

  return {
    originalSize: data.length,
    compressedSize: encrypted.length,
  };
}

export function accessFile(
  fileId: string,
  fileName: string,
  vaultFolderPath: string,
  masterKey: Buffer
): string {
  const encPath = path.join(getFilesDir(vaultFolderPath), `${fileId}.enc`);
  if (!fs.existsSync(encPath)) throw new Error('Encrypted file not found');

  const encrypted = fs.readFileSync(encPath);
  const fileKey = deriveFileKey(masterKey, fileId);
  const decrypted = decryptData(encrypted, fileKey);

  const tempDir = getTempDir();
  const tempPath = path.join(tempDir, fileName);
  fs.writeFileSync(tempPath, decrypted, { mode: 0o600 });

  // Open with default system application
  shell.openPath(tempPath);

  return tempPath;
}

export function deleteEncryptedFile(fileId: string, vaultFolderPath: string): void {
  const encPath = path.join(getFilesDir(vaultFolderPath), `${fileId}.enc`);
  secureDelete(encPath);
}

export function cleanupTempFiles(): void {
  const tempDir = path.join(app.getPath('userData'), 'vault-temp');
  if (!fs.existsSync(tempDir)) return;

  const files = fs.readdirSync(tempDir);
  for (const file of files) {
    secureDelete(path.join(tempDir, file));
  }
}

export function deleteOriginalSecurely(sourcePath: string): void {
  secureDelete(sourcePath);
}

export function checkFileSize(size: number): 'ok' | 'warn' | 'reject' {
  if (size > MAX_FILE_SIZE) return 'reject';
  if (size > WARN_FILE_SIZE) return 'warn';
  return 'ok';
}
