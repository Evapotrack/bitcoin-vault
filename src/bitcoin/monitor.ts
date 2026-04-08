import type { NetworkType } from '../types/vault';
import { checkPayment } from './utxo';

const POLL_INTERVAL = 15000; // 15 seconds

export interface PaymentMonitor {
  start(): void;
  stop(): void;
}

export function createPaymentMonitor(
  address: string,
  expectedAmount: number,
  networkType: NetworkType,
  onDetected: () => void,
  onConfirmed: (txid: string) => void,
  onError: (error: string) => void
): PaymentMonitor {
  let timer: ReturnType<typeof setInterval> | null = null;
  let detected = false;

  const poll = async () => {
    try {
      const result = await checkPayment(address, expectedAmount, networkType);

      if (result.found && !detected) {
        detected = true;
        onDetected();
      }

      if (result.found && result.confirmed && result.txid) {
        stop();
        onConfirmed(result.txid);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment check failed');
    }
  };

  const start = () => {
    if (timer) return;
    poll(); // Immediate first check
    timer = setInterval(poll, POLL_INTERVAL);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  return { start, stop };
}
