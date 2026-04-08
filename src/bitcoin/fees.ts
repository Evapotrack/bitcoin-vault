import type { NetworkType } from '../types/vault';

function getBaseUrl(networkType: NetworkType): string {
  return networkType === 'testnet'
    ? 'https://mempool.space/testnet/api'
    : 'https://mempool.space/api';
}

export interface FeeEstimates {
  fast: number;   // sat/vB, ~10 min
  medium: number; // sat/vB, ~30 min
  slow: number;   // sat/vB, ~60 min
}

const FEE_CEILING = 100; // sat/vB hard cap

export async function fetchFeeEstimates(networkType: NetworkType): Promise<FeeEstimates> {
  const url = `${getBaseUrl(networkType)}/v1/fees/recommended`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch fees: ${res.status}`);

  const data: { fastestFee: number; halfHourFee: number; hourFee: number } = await res.json();

  return {
    fast: Math.min(data.fastestFee, FEE_CEILING),
    medium: Math.min(data.halfHourFee, FEE_CEILING),
    slow: Math.min(data.hourFee, FEE_CEILING),
  };
}
