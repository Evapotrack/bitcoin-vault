import type { NetworkType, UTXO } from '../types/vault';

function getBaseUrl(networkType: NetworkType): string {
  return networkType === 'testnet'
    ? 'https://mempool.space/testnet/api'
    : 'https://mempool.space/api';
}

async function fetchBlockHeight(networkType: NetworkType): Promise<number> {
  const url = `${getBaseUrl(networkType)}/blocks/tip/height`;
  const res = await fetch(url);
  if (!res.ok) return 0;
  return parseInt(await res.text(), 10);
}

export async function fetchUtxos(address: string, derivationIndex: number, networkType: NetworkType): Promise<UTXO[]> {
  const url = `${getBaseUrl(networkType)}/address/${address}/utxo`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch UTXOs: ${res.status}`);

  const currentHeight = await fetchBlockHeight(networkType);
  const data: Array<{ txid: string; vout: number; value: number; status: { confirmed: boolean; block_height?: number } }> = await res.json();

  return data.map(u => ({
    txid: u.txid,
    vout: u.vout,
    value: u.value,
    address,
    derivationIndex,
    confirmations: u.status.confirmed && u.status.block_height
      ? currentHeight - u.status.block_height + 1
      : 0,
  }));
}

export async function fetchBalance(addresses: Array<{ address: string; index: number }>, networkType: NetworkType): Promise<number> {
  let total = 0;
  for (const { address, index } of addresses) {
    const utxos = await fetchUtxos(address, index, networkType);
    for (const u of utxos) {
      total += u.value;
    }
  }
  return total;
}

export async function fetchAllUtxos(addresses: Array<{ address: string; index: number }>, networkType: NetworkType): Promise<UTXO[]> {
  const all: UTXO[] = [];
  for (const { address, index } of addresses) {
    const utxos = await fetchUtxos(address, index, networkType);
    all.push(...utxos);
  }
  return all;
}

export async function checkPayment(
  address: string,
  expectedAmount: number,
  networkType: NetworkType
): Promise<{ found: boolean; confirmed: boolean; txid?: string; amount?: number }> {
  const url = `${getBaseUrl(networkType)}/address/${address}/txs`;
  const res = await fetch(url);
  if (!res.ok) return { found: false, confirmed: false };

  const txs: Array<{
    txid: string;
    status: { confirmed: boolean };
    vout: Array<{ scriptpubkey_address?: string; value: number }>;
  }> = await res.json();

  for (const tx of txs) {
    for (const output of tx.vout) {
      if (output.scriptpubkey_address === address) {
        if (output.value >= expectedAmount) {
          return {
            found: true,
            confirmed: tx.status.confirmed,
            txid: tx.txid,
            amount: output.value,
          };
        }
      }
    }
  }

  return { found: false, confirmed: false };
}
