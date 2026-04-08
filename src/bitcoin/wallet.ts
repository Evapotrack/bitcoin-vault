import * as crypto from 'crypto';
import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import type { NetworkType } from '../types/vault';

const bip32 = BIP32Factory(ecc);

function getNetwork(networkType: NetworkType): bitcoin.Network {
  return networkType === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
}

export function generateMnemonic(): string {
  const entropy = crypto.randomBytes(16); // 128 bits, CSPRNG only
  return bip39.entropyToMnemonic(entropy.toString('hex'));
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

export async function mnemonicToSeed(mnemonic: string): Promise<Buffer> {
  return Buffer.from(await bip39.mnemonicToSeed(mnemonic));
}

export function deriveAddress(seed: Buffer, index: number, networkType: NetworkType): { address: string; publicKey: Buffer } {
  const network = getNetwork(networkType);
  const root = bip32.fromSeed(seed, network);
  const coinType = networkType === 'mainnet' ? 0 : 1;
  const child = root.derivePath(`m/84'/${coinType}'/0'/0/${index}`);

  const { address } = bitcoin.payments.p2wpkh({
    pubkey: child.publicKey,
    network,
  });

  const result = { address: address!, publicKey: Buffer.from(child.publicKey) };

  // Zero the private key from the derived node
  if (child.privateKey) {
    child.privateKey.fill(0);
  }

  return result;
}

export function deriveChangeAddress(seed: Buffer, index: number, networkType: NetworkType): { address: string; publicKey: Buffer } {
  const network = getNetwork(networkType);
  const root = bip32.fromSeed(seed, network);
  const coinType = networkType === 'mainnet' ? 0 : 1;
  const child = root.derivePath(`m/84'/${coinType}'/0'/1/${index}`);

  const { address } = bitcoin.payments.p2wpkh({
    pubkey: child.publicKey,
    network,
  });

  const result = { address: address!, publicKey: Buffer.from(child.publicKey) };

  if (child.privateKey) {
    child.privateKey.fill(0);
  }

  return result;
}

export function deriveKeyPair(seed: Buffer, path: string, networkType: NetworkType): { privateKey: Buffer; publicKey: Buffer } {
  const network = getNetwork(networkType);
  const root = bip32.fromSeed(seed, network);
  const child = root.derivePath(path);
  return {
    privateKey: Buffer.from(child.privateKey!),
    publicKey: Buffer.from(child.publicKey),
  };
}

export function deriveMasterEncryptionKey(seed: Buffer): Buffer {
  return crypto.createHmac('sha512', 'bitcoin-vault-encryption').update(seed).digest().subarray(0, 32);
}
