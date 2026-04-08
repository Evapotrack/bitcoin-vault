import * as crypto from 'crypto';
import * as zlib from 'zlib';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const HKDF_INFO = 'bitcoin-vault-file-key';

// Derive a per-file encryption key from the master key + file ID
export function deriveFileKey(masterKey: Buffer, fileId: string): Buffer {
  return crypto.hkdfSync('sha256', masterKey, fileId, HKDF_INFO, 32) as unknown as Buffer;
}

// Compress then encrypt
export function encryptData(plaintext: Buffer, key: Buffer): Buffer {
  // Compress with zlib
  const compressed = zlib.deflateSync(plaintext);

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);

  // Encrypt with AES-256-GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: [IV (16)] [AUTH_TAG (16)] [CIPHERTEXT]
  return Buffer.concat([iv, authTag, encrypted]);
}

// Decrypt then decompress
export function decryptData(ciphertext: Buffer, key: Buffer): Buffer {
  // Extract IV, auth tag, and encrypted data
  const iv = ciphertext.subarray(0, IV_LENGTH);
  const authTag = ciphertext.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = ciphertext.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  // Decrypt with AES-256-GCM
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  const compressed = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  // Decompress with zlib
  return zlib.inflateSync(compressed);
}

// Encrypt the vault index
export function encryptIndex(data: string, masterKey: Buffer): Buffer {
  const indexKey = deriveFileKey(masterKey, 'vault-index');
  return encryptData(Buffer.from(data, 'utf-8'), indexKey);
}

// Decrypt the vault index
export function decryptIndex(ciphertext: Buffer, masterKey: Buffer): string {
  const indexKey = deriveFileKey(masterKey, 'vault-index');
  return decryptData(ciphertext, indexKey).toString('utf-8');
}

// Secure file deletion: overwrite with random bytes then unlink
export function secureDelete(filePath: string): void {
  try {
    const stat = require('fs').statSync(filePath);
    const randomData = crypto.randomBytes(stat.size);
    require('fs').writeFileSync(filePath, randomData);
    require('fs').unlinkSync(filePath);
  } catch {
    // File may already be deleted
    try {
      require('fs').unlinkSync(filePath);
    } catch {
      // Ignore
    }
  }
}
