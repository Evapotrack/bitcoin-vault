# Bitcoin Vault

Encrypt your files locally. Unlock them with Bitcoin.

Bitcoin Vault is a macOS desktop app that encrypts files on your machine and decrypts them only after a Bitcoin payment is verified on-chain with one confirmation. The app generates its own HD wallet from a 12-word seed — the same seed controls your Bitcoin addresses and your file encryption keys. No file data touches the blockchain. No cloud. No server. No AI. No recurring costs. Your keys, your files, your machine, verified by Bitcoin.

## How It Works

1. **Set up your vault.** The app generates a 12-word seed phrase. Write it down — this is the only time you'll see it. Choose an unlock cost (in sats) and how long the vault stays open after each payment.

2. **Lock screen.** When the vault is locked, you see a QR code, a Bitcoin address, and a sat amount. Scan the QR with any wallet (Strike, Muun, BlueWallet, or any other), send the exact amount, and wait for one confirmation — about 10 minutes.

3. **Access your files.** Once confirmed, the vault decrypts its index and you can browse, open, and add files. Files are compressed and encrypted with AES-256-GCM using keys derived from your seed. On disk, they're opaque ciphertext with random IDs — an observer learns nothing about what you're protecting.

4. **Vault locks.** When you lock the vault (manually, by timer, or by closing the app), all temporary decrypted files are overwritten with random bytes and deleted. No plaintext remains on disk.

Every unlock derives a fresh address. No address is ever reused. No on-chain pattern links your access events.

## What This App Does Not Do

- **Does not store data on the blockchain.** The chain carries only standard payment transactions. Zero file data, zero arbitrary data, zero bloat.
- **Does not use cloud storage.** All files stay on your local machine. No accounts, no subscriptions, no counterparty risk.
- **Does not use AI.** No API calls beyond mempool.space for payment verification. No recurring costs.
- **Does not replace your existing wallet.** The vault accumulates small amounts from unlock payments. For significant holdings, use hardware cold storage.
- **Does not compete with VeraCrypt or FileVault.** Those tools are mature and battle-tested for general-purpose encryption. This app adds Bitcoin-based access control on top of encryption — that's the differentiator.

## Philosophy

Bitcoin is not a database.

In 2025, Bitcoin Core removed the longstanding 83-byte OP_RETURN limit, effectively allowing megabytes of arbitrary data per transaction. This reignited the debate about whether Bitcoin should be a monetary network or a general-purpose data ledger.

This app takes a different position: store your data locally, encrypt it on your own hardware, and use Bitcoin only for what it does best — verify payments. A transaction proves you paid. The blockchain confirms it. Your local app decrypts your local files. The chain carries only the payment. Your files never touch the blockchain.

The philosophy is simple: Bitcoin is money. Use it as money. Store your data where it belongs — on your own machine.

## Security Model

**This is a hot wallet.** The app holds private keys on your machine and signs transactions internally. It is designed for the small amounts that accumulate from unlock payments, not for storing significant Bitcoin. The app displays a persistent "Hot wallet — small amounts only" reminder.

**Encryption:** AES-256-GCM with keys derived via HKDF from your HD seed. Each file has its own encryption key — compromising one file's ciphertext does not expose others. The vault index (file structure, names, protection settings) is itself encrypted.

**Unlock verification:** Three mandatory checks enforced in the app's main process (not just the UI):
  1. Transaction pays to the exact derived address for this unlock request
  2. Amount is exactly the required cost — no tolerance, no rounding
  3. At least one confirmation on the Bitcoin base chain

There is no 0-conf mode. No override. No alternative unlock path.

**Electron hardening:** Context isolation enabled, Node.js integration disabled in the renderer, no remote content loaded, Content Security Policy set, Electron fuses hardened. Informed by real-world Electron wallet exploits.

**Temporary files:** Decrypted files are placed in a secure directory with restrictive permissions. On vault lock, they are overwritten with random bytes and deleted. No plaintext persists when the vault is locked.

## Installation

**Prerequisites:** macOS (Sequoia or later), Node.js, npm

```
git clone https://github.com/Evapotrack/bitcoin-vault.git
cd bitcoin-vault
npm install
npm start
```

The app launches in testnet mode by default. Do not use with real sats or real files until you've tested thoroughly and reviewed the security documentation.

## Usage

**First launch — Setup Wizard:**
- Choose "Create New Vault" (or "Restore Existing Vault" if recovering from backup)
- Write down your 12-word seed phrase on paper. This is the only time it will be shown.
- Verify your seed by re-entering three randomly selected words
- Choose testnet or mainnet, set your unlock cost (minimum 750 sats), choose an access frequency, and pick a folder for your encrypted files

**Adding files:**
- Drag files into the vault browser or click "Add Files"
- Review in the staging area, optionally set per-file protection
- Files are compressed and encrypted on import
- Choose whether to securely delete the originals

**Unlocking:**
- The lock screen shows a QR code and address
- Send the exact required amount from any Bitcoin wallet
- Wait for one on-chain confirmation (~10 minutes)
- The vault opens automatically

**Sending sats:**
- Open the Wallet view to see your balance and UTXOs
- Enter a destination address and amount
- Review full transaction details (inputs, outputs, fee) before confirming

## Backup

You need two things for a full recovery:

**Your 12-word seed phrase.** Write it on paper during setup. For long-term durability, stamp each word into a stainless steel plate using a center punch and letter stamps. Store it separately from your computer — a home safe, a bank safe deposit box, or with someone you trust. Never photograph it. Never store it digitally.

**Your encrypted vault folder.** Back up the vault folder (default: `~/Documents/BitcoinVault/`) to iCloud, Time Machine, or an external drive. The files are encrypted at rest — safe to store anywhere.

| What you have | What you recover |
|---|---|
| Seed + encrypted folder | Everything — files, wallet, settings |
| Seed only | Wallet balance only — files require the encrypted folder |
| Encrypted folder only | Nothing — files are unreadable without the seed |

There is no recovery without the seed. No support team, no reset, no backdoor. This is self-custody.

## Warnings

- **This is experimental software.** Use on testnet first. Do not trust it with irreplaceable files or significant Bitcoin until you've verified the full backup/restore cycle yourself.
- **This is a hot wallet.** Private keys exist on a general-purpose computer. Keep amounts small.
- **One confirmation takes ~10 minutes.** The unlock wait is by design. If you need instant access to files, this is not the right tool.
- **1 GB file size limit** in V1. Files above 100 MB trigger a warning.
- **macOS only** in V1.

## Roadmap

**V1 — Core Vault + Wallet** (current)
- File encryption/decryption with Bitcoin unlock
- HD wallet (receive, send)
- Setup wizard with create and restore paths
- Lock screen, vault browser, wallet view, settings, in-app guide

**V2 — Tiered Protection + Dead Man's Switch**
- Per-folder and per-file cost and frequency settings
- Deletion restrictions (require recent payment to delete)
- Dead man's switch for inheritance (countdown timer, proof-of-life payments)

**V3 — Wallet Features**
- UTXO consolidation at low fees
- Auto-labeling by unlock event
- Transaction history

**Future**
- File timestamping via OP_RETURN (32-byte SHA-256 hash — the file stays local, only the proof goes on-chain)
- Tor routing
- Custom Esplora backend
- Multi-signature access
- Multiple vaults per app

## Documentation

- `VAULT_PROGRESS.md` — Full project document: design decisions, architecture, UI/UX, security (25 items), privacy (12 items), testing (24 cases)
- `VAULT_NOTEBOOK.md` — Educational overview (what, how, why, limits, security, privacy)
- `SECURITY_TEST_PROCEDURES.txt` — Step-by-step test execution guide for all 24 test cases
- `THREAT_MODEL.txt` — Systematic analysis of attack vectors with mitigations
- `RECOVERY_AND_BACKUP_GUIDE.txt` — Non-technical guide for restoring from backup
- `CHANGELOG.txt` — Version history and release notes

## License

TBD — to be chosen before open source release.

## Contributing

Contributions are welcome. Please read the project documentation before submitting changes, especially the security model and design decisions in `VAULT_PROGRESS.md`. The architecture is intentional — if something looks like it could be simpler, there's usually a documented reason it isn't.

Before submitting a PR:
- Run `npx tsc --noEmit` (no type errors)
- Run `npm audit` (no known vulnerabilities)
- Do not commit seeds, keys, addresses, real file names, or personal data
- Test on testnet

## Author

Andrew Brown
