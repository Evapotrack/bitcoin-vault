import type { NetworkType, UTXO } from '../types/vault';

function getBaseUrl(networkType: NetworkType): string {
  return networkType === 'testnet'
    ? 'https://mempool.space/testnet/api'
    : 'https://mempool.space/api';
}

export async function fetchUtxos(address: string, networkType: NetworkType): Promise<UTXO[]> {
  const url = `${getBaseUrl(networkType)}/address/${address}/utxo`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch UTXOs: ${res.status}`);

  const data: Array<{ txid: string; vout: number; value: number; status: { confirmed: boolean; block_height?: number } }> = await res.json();

  return data.map(u => ({
    txid: u.txid,
    vout: u.vout,
    value: u.value,
    address,
    confirmations: u.status.confirmed ? 1 : 0,
  }));
}

export async function fetchBalance(addresses: string[], networkType: NetworkType): Promise<number> {
  let total = 0;
  for (const addr of addresses) {
    const utxos = await fetchUtxos(addr, networkType);
    for (const u of utxos) {
      total += u.value;
    }
  }
  return total;
}

export async function fetchAllUtxos(addresses: string[], networkType: NetworkType): Promise<UTXO[]> {
  const all: UTXO[] = [];
  for (const addr of addresses) {
    const utxos = await fetchUtxos(addr, networkType);
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
        if (output.value === expectedAmount) {
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
