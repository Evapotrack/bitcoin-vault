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

## What This Is Not

- **Not a replacement for VeraCrypt or FileVault.** Those tools are mature, audited, and battle-tested. This adds Bitcoin-based access control on top of encryption.
- **Not a cold storage wallet.** This is a hot wallet for small amounts accumulated from unlock payments.
- **Not audited software.** This is experimental. Use on testnet first. Do not trust it with irreplaceable files or significant Bitcoin.

## Status

V1 — core vault + wallet functional. Testnet ready. Open source.

Similar projects may exist — I haven't researched the space. This was built to explore the concept, not to compete with existing solutions.

## Built With

This entire project — design, architecture, code, documentation — was built using Claude Code on a 2025 MacBook Air. It is an experiment in what a solo developer can build with AI-assisted tooling applied to a sovereignty-first idea.

## Links

- **Repository:** [github.com/Evapotrack/bitcoin-vault](https://github.com/Evapotrack/bitcoin-vault)
- **Author:** Andrew Brown
