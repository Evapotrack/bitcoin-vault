import React from 'react';

export function HowTo() {
  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-white mb-6">How To</h2>

      <div className="space-y-8 text-sm">
        <Section title="What is Bitcoin Vault?">
          Bitcoin Vault encrypts files on your machine and decrypts them only after a Bitcoin payment
          is verified on-chain with one confirmation. Your 12-word seed controls both your Bitcoin
          addresses and your file encryption keys. No file data touches the blockchain. No cloud.
          No server. No AI. Your keys, your files, your machine, verified by Bitcoin.
        </Section>

        <Section title="How to unlock your vault">
          The lock screen shows a QR code and a Bitcoin address. Open any wallet on your phone
          (Strike, Muun, BlueWallet) and send the exact required amount to that address. Wait for
          one confirmation — about 10 minutes. The vault decrypts automatically once confirmed.
          Each unlock derives a fresh address. No address is ever reused.
        </Section>

        <Section title="How to add files">
          Click &quot;Add Files&quot; in the vault browser. Select files from your computer. They appear
          in a staging area where you can review them. Files are compressed with zlib, then encrypted
          with AES-256-GCM using a key derived from your seed. On disk, they are opaque ciphertext
          with random IDs. After encryption, you can optionally delete the originals securely.
        </Section>

        <Section title="How to access files">
          Double-click a file in the vault browser. The app decrypts it to a secure temporary
          directory and opens it with your default application. When you lock the vault, all
          temporary files are overwritten with random bytes and deleted. No plaintext remains
          on disk when the vault is locked.
        </Section>

        <Section title="How to protect files">
          In V2, you will be able to set per-folder and per-file protection with different
          unlock costs and frequencies. For now, all files share the vault-level unlock settings.
        </Section>

        <Section title="How to send sats">
          Open the Wallet view. Enter a destination address and amount. Review the full transaction
          details — all inputs, outputs, and fees — before confirming. The app signs internally
          and broadcasts via mempool.space.
        </Section>

        <Section title="How to back up your vault">
          You need two things for a full recovery:{'\n\n'}
          <strong>Your 12-word seed phrase.</strong> Write it on paper during setup. For long-term
          durability, stamp each word into a stainless steel plate. Store separately from your
          computer.{'\n\n'}
          <strong>Your encrypted vault folder.</strong> Back up to iCloud, Time Machine, or an
          external drive. The files are encrypted at rest — safe to store anywhere.{'\n\n'}
          Seed + encrypted folder = full recovery.{'\n'}
          Seed only = wallet balance only.{'\n'}
          Encrypted folder only = nothing (unreadable without seed).
        </Section>

        <Section title="When do I need my seed?">
          Only during recovery. You do NOT need your seed for normal use. The app stores it
          securely in your macOS Keychain.{'\n\n'}
          You need your seed if: your Mac is lost or destroyed, your Keychain is corrupted,
          or you&apos;re moving the vault to a different machine.
        </Section>

        <Section title="How to recover your vault">
          Install Bitcoin Vault on a new Mac. Choose &quot;Restore Existing Vault.&quot; Enter your 12 words.
          Point to your backed-up encrypted folder. The app derives the keys, decrypts the index,
          and scans the blockchain for wallet balance. Full recovery with all files, structure,
          and settings.
        </Section>

        <Section title="Security">
          This is a hot wallet — private keys exist on your machine. Keep amounts small.{'\n\n'}
          Encryption: AES-256-GCM with per-file keys derived via HKDF from your seed.{'\n'}
          Unlock: 1 confirmation required. No 0-conf. No override.{'\n'}
          Electron: Context isolation enabled, no Node.js in renderer, CSP enforced.{'\n'}
          Temp files: Overwritten with random bytes and deleted on vault lock.{'\n'}
          Clipboard: Auto-clears 60 seconds after copying an address.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-orange-400 font-semibold text-base mb-2">{title}</h3>
      <div className="text-gray-300 leading-relaxed whitespace-pre-line">{children}</div>
    </div>
  );
}
