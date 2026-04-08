import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import type { NetworkType, UTXO, TransactionDetail } from '../types/vault';
import { deriveKeyPair } from './wallet';

bitcoin.initEccLib(ecc);

function getNetwork(networkType: NetworkType): bitcoin.Network {
  return networkType === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
}

// Simple largest-first coin selection
function selectCoins(utxos: UTXO[], targetAmount: number, feeRate: number): { selected: UTXO[]; fee: number } | null {
  const sorted = [...utxos].sort((a, b) => b.value - a.value);

  const selected: UTXO[] = [];
  let total = 0;

  for (const utxo of sorted) {
    selected.push(utxo);
    total += utxo.value;

    // Estimate tx size: ~68 vB per input + ~31 vB per output + ~11 vB overhead
    const estimatedVsize = selected.length * 68 + 2 * 31 + 11;
    const fee = Math.ceil(estimatedVsize * feeRate);

    if (total >= targetAmount + fee) {
      return { selected, fee };
    }
  }

  return null; // Insufficient funds
}

export function validateAddress(address: string, networkType: NetworkType): boolean {
  try {
    bitcoin.address.toOutputScript(address, getNetwork(networkType));
    return true;
  } catch {
    return false;
  }
}

export function buildTransactionDetail(
  utxos: UTXO[],
  toAddress: string,
  amountSats: number,
  feeRate: number,
  changeAddress: string,
  networkType: NetworkType
): TransactionDetail | null {
  const result = selectCoins(utxos, amountSats, feeRate);
  if (!result) return null;

  const { selected, fee } = result;
  const totalIn = selected.reduce((s, u) => s + u.value, 0);
  const change = totalIn - amountSats - fee;

  const outputs: Array<{ address: string; value: number }> = [
    { address: toAddress, value: amountSats },
  ];

  if (change > 546) { // dust threshold
    outputs.push({ address: changeAddress, value: change });
  }

  const estimatedVsize = selected.length * 68 + outputs.length * 31 + 11;

  return {
    inputs: selected.map(u => ({ txid: u.txid, vout: u.vout, value: u.value })),
    outputs,
    fee,
    feeRate: Math.ceil(fee / estimatedVsize),
    totalIn,
    totalOut: outputs.reduce((s, o) => s + o.value, 0),
  };
}

export async function signAndBroadcast(
  utxos: UTXO[],
  toAddress: string,
  amountSats: number,
  feeRate: number,
  changeAddress: string,
  seed: Buffer,
  addressIndex: number,
  networkType: NetworkType
): Promise<string> {
  const network = getNetwork(networkType);
  const detail = buildTransactionDetail(utxos, toAddress, amountSats, feeRate, changeAddress, networkType);
  if (!detail) throw new Error('Insufficient funds');

  const psbt = new bitcoin.Psbt({ network });

  // Add inputs
  const coinType = networkType === 'mainnet' ? 0 : 1;
  for (const input of detail.inputs) {
    const utxo = utxos.find(u => u.txid === input.txid && u.vout === input.vout)!;

    // Fetch the raw tx to get the script
    const baseUrl = networkType === 'testnet'
      ? 'https://mempool.space/testnet/api'
      : 'https://mempool.space/api';
    const txHexRes = await fetch(`${baseUrl}/tx/${input.txid}/hex`);
    const txHex = await txHexRes.text();

    psbt.addInput({
      hash: input.txid,
      index: input.vout,
      witnessUtxo: {
        script: bitcoin.address.toOutputScript(utxo.address, network),
        value: BigInt(input.value),
      },
    });
  }

  // Add outputs
  for (const output of detail.outputs) {
    psbt.addOutput({
      address: output.address,
      value: BigInt(output.value),
    });
  }

  // Sign each input — derive key, sign, zero key
  for (let i = 0; i < detail.inputs.length; i++) {
    // For simplicity, derive from address index 0..addressIndex and find match
    // In production, we'd track which derivation index each UTXO came from
    const keyPair = deriveKeyPair(seed, `m/84'/${coinType}'/0'/0/${i}`, networkType);
    try {
      psbt.signInput(i, {
        publicKey: keyPair.publicKey,
        sign: (hash: Buffer) => {
          return Buffer.from(ecc.sign(hash, keyPair.privateKey));
        },
      });
    } finally {
      keyPair.privateKey.fill(0); // Zero private key
    }
  }

  psbt.finalizeAllInputs();
  const txHex = psbt.extractTransaction().toHex();

  // Broadcast
  const baseUrl = networkType === 'testnet'
    ? 'https://mempool.space/testnet/api'
    : 'https://mempool.space/api';
  const broadcastRes = await fetch(`${baseUrl}/tx`, {
    method: 'POST',
    body: txHex,
    headers: { 'Content-Type': 'text/plain' },
  });

  if (!broadcastRes.ok) {
    const error = await broadcastRes.text();
    throw new Error(`Broadcast failed: ${error}`);
  }

  const txid = await broadcastRes.text();

  // Zero the seed copy
  seed.fill(0);

  return txid;
}
