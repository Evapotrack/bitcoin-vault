# Bitcoin Vault — Project Summary

**Encrypt your files locally. Unlock them with Bitcoin.**

Bitcoin Vault is an experimental macOS desktop app that encrypts files on your machine and unlocks them only after a Bitcoin payment is verified on-chain with one confirmation. Built entirely with Claude Code by a solo developer as an open-source experiment combining file encryption with Bitcoin-based access control.

This is not a product pitch. This is an experiment. I have not researched whether similar projects exist. If they do, that's fine — this was built to explore the idea, learn from the process, and document the results honestly.

## What It Does

You set up a vault with a 12-word seed phrase. That seed generates both your Bitcoin addresses and your file encryption keys. You drag files into the vault — they get compressed, encrypted with AES-256-GCM, and stored on disk as opaque ciphertext. When the vault is locked, no one can read your files without the seed.

To unlock, the app shows a QR code with a Bitcoin address and an amount. You send sats from any wallet. After one on-chain confirmation (~10 minutes), the vault decrypts and you can access your files. Every unlock uses a fresh address — no address reuse, no on-chain pattern linking your access events.

The app is also a Bitcoin wallet. It accumulates sats from unlock payments. You can send them to an external address through the wallet view, with full transaction detail displayed before broadcast.

**No cloud. No server. No AI. No recurring costs.** The only external connection is to mempool.space for payment verification.

## Why It Was Made

### Bitcoin Is Not a Database

In 2025, Bitcoin Core merged a change removing the longstanding 83-byte OP_RETURN limit, effectively allowing megabytes of arbitrary data per transaction in Bitcoin Core 30. This reignited a fundamental debate about whether Bitcoin should be a monetary network or a general-purpose data ledger.

I support Bitcoin Knots and BIP-110 (Restrict Transaction Versions). The concern is real: unrestricted on-chain data encourages blockchain bloat, increases storage requirements for full node operators, and risks pricing average users out of running their own node. Running a full node should remain affordable and accessible to individuals on modest hardware. When the blockchain grows unchecked with arbitrary data — images, documents, media stuffed into transactions — the cost of storing and verifying the chain increases for everyone. The people who lose first are individuals running nodes at home. When those people can no longer participate, verification concentrates in data centers and corporations, and Bitcoin's permissionless nature erodes.

This app demonstrates the alternative: **keep your data on your own machine, encrypted, and use Bitcoin only for what it does best — verify payments.** The blockchain carries only standard payment transactions. Zero file data. Zero arbitrary data. Zero bloat. Your files never touch the blockchain.

A Bitcoin enthusiast who wants to secure their personal files doesn't need to bloat the chain to do it. They need encryption, a payment, and a verification. This app provides all three without adding a single unnecessary byte to the blockchain that every node operator in the world must store forever.

### Self-Custody as a Design Principle

No accounts. No subscriptions. No counterparty risk. One seed backs up everything — your wallet and your encrypted files. The app communicates clearly that this is a hot wallet for small amounts, not cold storage. Recovery requires only the seed phrase and the encrypted vault folder.

## How It Works

**Proof of Work secures the unlock mechanism.** The app requires one confirmation on the Bitcoin base chain — meaning a miner must include your transaction in a block, backed by real proof of work. No 0-conf. No override. No alternative unlock path. The ~10-minute wait is a feature: it forces intentional, deliberate access to your files.

**Three mandatory verification checks** (enforced in the app's main process, not just the UI):
1. Transaction pays to the exact derived address
2. Amount is exactly the required unlock cost (no tolerance)
3. At least one confirmation on the base chain

**Encryption:** AES-256-GCM with per-file keys derived via HKDF from the HD seed. Each file has its own encryption key — compromising one file's ciphertext does not expose others.

**Privacy:** Fresh BIP84 address per unlock. Only address queries leave the device (to mempool.space). No analytics, no telemetry, no crash reporting. On-chain, unlock transactions are standard Bitcoin payments — indistinguishable from any other payment.

**Security:** Electron hardened with context isolation, no Node.js in the renderer, Content Security Policy enforced, single instance lock, Electron fuses set. Temporary decrypted files are overwritten with random bytes and deleted on vault lock. Clipboard auto-clears after 60 seconds.

## Tech Stack

- **Runtime:** Electron (latest stable)
- **Frontend:** React 19, TypeScript, Tailwind CSS 4
- **State:** Zustand 5
- **Bitcoin:** bitcoinjs-lib 7, bip32, bip39, tiny-secp256k1
- **Encryption:** Node.js crypto (AES-256-GCM, HKDF), zlib compression
- **Key Storage:** Electron safeStorage (macOS Keychain)
- **External API:** mempool.space only

**No AI. No Anthropic SDK. No LLM. No recurring API costs.** The app connects only to mempool.space for payment verification and UTXO data.

## Honest Assessment

**Where Bitcoin adds genuine value:**
- Real economic friction for file access that a "confirm" dialog cannot replicate
- On-chain verification via proof of work — the most secure settlement layer ever built
- Self-funding model — no payment processor, no intermediary

**Where Bitcoin might be redundant:**
- The encryption works without Bitcoin (AES-256-GCM is standard)
- A password-only unlock would be simpler and faster
- The wallet adds complexity for what is essentially a piggy bank

**The honest conclusion:** Bitcoin is not redundant here, but its value is more philosophical than purely practical. The economic friction is real. The proof-of-work verification is real. But the core functionality (encrypted files) would work without it. What Bitcoin adds is identity — this is a sovereignty tool, not just an encryption tool.

## Who This Is For

- **Personal document security.** Tax records, legal files, estate planning, insurance policies. Files you access occasionally with deliberate intent. The 10-minute unlock wait forces intentional access, not casual browsing.
- **Credential backup.** Seed phrases for other wallets, recovery codes, API keys, SSH keys. Two independent security factors: the seed (something you know) and the on-chain payment (something you prove).
- **Inheritance without third parties.** The dead man's switch enables controlled access after incapacity. Your inheritor needs only the seed and the backup folder. No lawyer, no cloud service. One sentence of instruction: "Install the app, enter these 12 words, point to the backup folder."
- **Tiered access within a single vault.** A journalist protecting sources can set /sources/ at 5,000 sats per access while keeping /drafts/ at vault-level cost. A developer can lock /keys/ behind per-access payment while leaving /docs/ open after vault unlock.
- **Proof of deliberate access.** Every unlock is a timestamped blockchain transaction. Provides an auditable record that access was intentional and authorized.

## Who This Is NOT For

- Anyone needing fast, frequent file access — use VeraCrypt or FileVault
- Anyone storing significant Bitcoin — use hardware cold storage
- Anyone requiring audited enterprise encryption — this is experimental
- Teams or multi-user access — single seed, single user

## What This Is Not

- **Not a replacement for VeraCrypt or FileVault.** Those tools are mature, audited, and battle-tested. This adds Bitcoin-based access control on top of encryption.
- **Not a cold storage wallet.** This is a hot wallet for small amounts accumulated from unlock payments.
- **Not audited software.** This is experimental. Use on testnet first. Do not trust it with irreplaceable files or significant Bitcoin.

## V2 Features

- **Per-file/folder protection** — Set custom sat cost and frequency for individual files and folders. Additional payment required to access protected items.
- **UTXO consolidation** — Combine multiple small UTXOs into one at the lowest fee rate. Preview with full fee breakdown before confirming.
- **Dead man's switch** — Configurable countdown (30-365 days). Send a proof-of-life payment to reset the timer. If the timer expires, the vault opens with seed only — no Bitcoin payment required. Designed for inheritance.
- **Fee estimation display** — Current fee rates (fast/medium/slow) with estimated costs for unlock, send, and consolidation operations.

## Status

V2 — core vault + wallet + protection tiers + consolidation + dead man's switch. Testnet ready. Open source.

Similar projects may exist — I haven't researched the space. This was built to explore the concept, not to compete with existing solutions.

## Built With

This entire project — design, architecture, code, documentation — was built using Claude Code on a 2025 MacBook Air. It is an experiment in what a solo developer can build with AI-assisted tooling applied to a sovereignty-first idea.

## Links

- **Repository:** [github.com/Evapotrack/bitcoin-vault](https://github.com/Evapotrack/bitcoin-vault)
- **Author:** Andrew Brown

---

## Privacy & Security Summary

*Last updated: April 8, 2026*

### What the app protects

- **Files at rest.** AES-256-GCM encryption with per-file keys derived via HKDF from your HD seed. Cracking one file's ciphertext does not expose others. On disk, files are opaque ciphertext with random IDs — an observer learns nothing about what you're protecting.
- **Access control.** Unlock requires a confirmed on-chain Bitcoin payment — proof of work verification via the most secure settlement network ever built. Three mandatory checks enforced in the app's main process (not the UI): correct address, exact amount, at least one confirmation.
- **Replay attacks.** Each transaction ID is logged. The same txid cannot unlock twice. Each address is used once and marked after unlock.
- **Key material.** Private keys exist in memory only during signing operations, then are zeroed immediately. The seed is stored encrypted in macOS Keychain via Electron safeStorage. The renderer process never has access to key material — all cryptographic operations happen in the main process behind IPC.
- **Temporary files.** Decrypted files are written to a secure directory (0600 permissions, inside app userData, not /tmp). On vault lock, all temp files are overwritten with random bytes and deleted. No plaintext remains on disk when locked.
- **Clipboard.** Auto-clears 60 seconds after copying an address. Also cleared on vault lock.
- **Password.** Hashed with scrypt (random 32-byte salt, timing-safe comparison). Not stored in plaintext.

### What leaves the device

- **Only mempool.space API queries.** Address lookups, UTXO fetches, fee estimates, and transaction broadcasts. No file names, vault structure, or non-Bitcoin data ever leaves the device.
- **Fresh address per unlock.** No address reuse. An observer watching mempool.space cannot link unlock events to the same vault by address pattern.
- **No analytics, telemetry, or crash reporting.** Zero. The app phones home only to mempool.space.

### What the app does NOT protect against

- **Physical access to an unlocked Mac.** If someone has your login password and the app is running, they may be able to access the vault or extract the seed from macOS Keychain. Lock your screen.
- **This is a hot wallet.** Private keys exist on a general-purpose computer. It is designed for small amounts from unlock payments, not for storing significant Bitcoin. For significant holdings, use hardware cold storage.
- **mempool.space is a trusted dependency.** If mempool.space is compromised and returns fabricated transaction data, the app cannot distinguish it from real data. Running your own node (deferred feature) eliminates this risk.
- **SSD wear leveling.** Overwritten data may persist in unused flash cells. This is a hardware-level limitation no software can fully mitigate. Enable FileVault (full-disk encryption) for maximum protection.
- **Physical coercion.** No software can defend against someone forcing you to unlock your vault.
- **Webpack requires `unsafe-eval` in the CSP during development.** This allows dynamic code execution in the renderer. In production builds, this should be tightened. `unsafe-inline` is required for Tailwind's style injection. These are known trade-offs documented in the Electron ecosystem.

### Electron hardening

- `contextIsolation: true` — strict isolation between main and renderer processes
- `nodeIntegration: false` — no direct Node.js access in renderer
- Preload script exposes only safe IPC methods (no key operations)
- External navigation blocked, new window creation blocked
- Content Security Policy restricts connections to `self` + `mempool.space` only
- Electron fuses: RunAsNode disabled, CookieEncryption enabled, NodeOptions disabled
- Single instance lock prevents concurrent access to vault data

### Single point of failure

One 12-word seed controls both your Bitcoin wallet and all file encryption keys. If the seed is compromised, both are exposed. If the seed is lost, both are lost. This is an intentional design trade-off: one backup instead of two, at the cost of concentrated risk. The app communicates this clearly to the user.
