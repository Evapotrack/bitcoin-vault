import { app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface SecureStore {
  seed?: string;
  passwordHash?: string;
  passwordSalt?: string;
  networkType?: string;
  vaultConfig?: string;
}

function getStorePath(): string {
  return path.join(app.getPath('userData'), 'secure-store.enc');
}

export function loadStore(): SecureStore {
  try {
    if (!safeStorage.isEncryptionAvailable()) return {};
    const storePath = getStorePath();
    if (!fs.existsSync(storePath)) return {};
    const encrypted = fs.readFileSync(storePath);
    const decrypted = safeStorage.decryptString(encrypted);
    return JSON.parse(decrypted);
  } catch {
    return {};
  }
}

export function saveStore(store: SecureStore): void {
  if (!safeStorage.isEncryptionAvailable()) return;
  const storePath = getStorePath();
  const json = JSON.stringify(store);
  const encrypted = safeStorage.encryptString(json);
  fs.writeFileSync(storePath, encrypted);
}

// Password: scryptSync + salt + timingSafeEqual
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(32).toString('hex');
  const hash = crypto.scryptSync(password, s, 64).toString('hex');
  return { hash, salt: s };
}

export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  const { hash } = hashPassword(password, storedSalt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

export function setPassword(password: string): void {
  const store = loadStore();
  const { hash, salt } = hashPassword(password);
  store.passwordHash = hash;
  store.passwordSalt = salt;
  saveStore(store);
}

export function checkPassword(password: string): boolean {
  const store = loadStore();
  if (!store.passwordHash || !store.passwordSalt) return false;
  return verifyPassword(password, store.passwordHash, store.passwordSalt);
}

export function hasPassword(): boolean {
  const store = loadStore();
  return !!store.passwordHash;
}

export function storeSeed(mnemonic: string): void {
  const store = loadStore();
  store.seed = mnemonic;
  saveStore(store);
}

export function getSeed(): string | null {
  const store = loadStore();
  return store.seed || null;
}

export function hasSeed(): boolean {
  return !!getSeed();
}

export function storeConfig(config: string): void {
  const store = loadStore();
  store.vaultConfig = config;
  saveStore(store);
}

export function getConfig(): string | null {
  const store = loadStore();
  return store.vaultConfig || null;
}
