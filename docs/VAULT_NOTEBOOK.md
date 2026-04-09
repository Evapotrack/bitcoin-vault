# Bitcoin Vault — Educational Reference
## What, How, When, Where, Why — Complete App Overview
### Source material for Google NotebookLM — optimized for educational audio
### Andrew Brown | April 2026

---

## About This Document

This document explains the Bitcoin Vault app from every angle: what it does, how it works, why it was built, where it fits in the Bitcoin ecosystem, and what can be learned from its development. It is structured for Google NotebookLM to generate educational audio summaries, Q&A, and study material.

The app's full technical specification and development reference is in VAULT_PROGRESS.md. This document is the explanation. That document is the build plan.

---

## What Is Bitcoin Vault?

Bitcoin Vault is a macOS desktop application that encrypts files and folders on your computer and unlocks them only when you send Bitcoin to an address the app controls. The payment is verified on the Bitcoin blockchain with one confirmation before any file is decrypted. No file data ever touches the blockchain. The app uses Bitcoin purely as an authentication and payment verification layer.

The app generates its own Bitcoin wallet from a 12-word BIP39 seed phrase. That same seed controls both the Bitcoin addresses (for receiving unlock payments) and the encryption keys (for encrypting and decrypting files). One seed backs up everything. The user writes it down on paper during setup and never sees it again in the app.

The vault is simultaneously a Bitcoin wallet. It can receive sats (through unlock payments), display balance, list UTXOs, send sats to external addresses, and consolidate small UTXOs. It holds private keys and signs transactions internally — this is a hot wallet, designed for small amounts, not a cold storage solution.

The app is built with Electron, React, Tailwind CSS, and bitcoinjs-lib. It runs on macOS, stores encrypted files in a user-visible folder (compatible with iCloud and Time Machine backups), and connects only to mempool.space for on-chain verification. No other servers, no cloud services, no AI, no recurring API costs.

---

## How Does It Work?

The user experience has six main flows:

SETUP: On first launch, the app generates a 12-word seed phrase and displays it for the user to write down on paper. The user verifies they wrote it correctly by re-entering three randomly selected words. Then they configure their vault: choose testnet or mainnet, set the unlock cost in sats (minimum 1,500), set the access frequency (how long the vault stays open after payment), and pick a folder location for encrypted files.

LOCKING AND UNLOCKING: When the vault is locked, the app shows a QR code and a Bitcoin address. The user opens any Bitcoin wallet on their phone (Strike, Muun, BlueWallet, or any other) and sends the exact required amount to that address. The app polls mempool.space and detects the incoming transaction. It waits for one confirmation — the transaction must be mined into a block on the Bitcoin base chain. This takes approximately 10 minutes on average. Once confirmed, the vault decrypts its index and the user can access their files. Each unlock derives a fresh address from the HD wallet, so no address is ever reused.

ADDING FILES: The user drags files into the app or uses a file picker. Selected files appear in a staging area where the user can review, remove items, and optionally set per-file protection settings (additional sat cost, access frequency, deletion restriction). When they click "Add to Vault," each file is compressed with zlib, then encrypted with AES-256-GCM using a key derived from the HD seed via HKDF. The encrypted file is stored on disk with a unique ID — the original filename and folder structure exist only in the encrypted index. After encryption completes, the app asks whether to securely delete the originals, with per-file checkboxes.

ACCESSING FILES: When the user clicks a file in the vault browser, the app decrypts it to a secure temporary directory and opens it with the default macOS application for that file type (Preview for images, TextEdit for text, etc.). When the vault locks — either manually, by auto-lock timer, or when the app closes — all temporary decrypted files are overwritten with random bytes and deleted. No plaintext remains on disk when the vault is locked.

SENDING SATS: The vault accumulates sats from unlock payments over time. The user can send these sats to any external Bitcoin address through the Wallet view. The app builds the transaction, signs it internally with the HD wallet's private keys, shows full transaction details (inputs, outputs, fee), and broadcasts after the user confirms.

RECOVERY: If the user's machine is lost or destroyed, they install the app on a new Mac, choose "Restore Existing Vault," enter their 12-word seed, and point to their backed-up encrypted files (from iCloud, Time Machine, or a manual backup). The app derives the encryption keys from the seed, decrypts the vault index, and scans the blockchain for existing UTXOs. The vault is restored with all files, folder structure, and settings intact.

The seed is only needed during recovery — never during normal daily use. The app stores the seed securely in the macOS Keychain and derives keys automatically. The user enters their seed only if: their Mac is lost or destroyed, their Keychain is corrupted, an inheritor accesses the vault after the dead man's switch triggers, or they're moving the vault to a different machine. For all other operations — unlocking, adding files, sending sats, changing settings — the seed is never re-entered.

SEED PRESERVATION: The 12-word seed should be stamped into a stainless steel plate using a center punch and letter stamps. Metal seed plates with letter grids are available from multiple vendors. Center punch style plates — where each letter is marked with a single punch strike on a grid — are the simplest and most durable option. Metal survives fire, flood, and decades of storage. Paper degrades. The metal plate should be stored separately from the computer: a home safe, bank safe deposit box, or with a trusted family member. It should never be photographed, never typed into any device other than this app during recovery, and never stored digitally.

---

## Why Was This App Built?

Three motivations drove the project:

PHILOSOPHY — BITCOIN IS NOT A DATABASE: In 2025, Bitcoin Core merged a change removing the longstanding 83-byte OP_RETURN limit, effectively allowing up to 4MB of arbitrary data per transaction output in Bitcoin Core 30. This reignited the debate about whether Bitcoin should be a monetary network or a general-purpose data ledger. Critics including Luke Dashjr and Samson Mow argued that unrestricted on-chain data encourages blockchain bloat, increases storage costs for full node operators, and risks centralizing verification in data centers rather than home computers.

This app demonstrates the alternative: keep your data on your own machine, encrypted, and use Bitcoin only for what Bitcoin does best — verify payments. The blockchain carries only standard transactions. No file data, no arbitrary data, no bloat. A 32-byte hash via OP_RETURN is offered as a deferred timestamping feature — and even that stays well within the original 83-byte limit.

PORTFOLIO — SHOWING RANGE: Bitcoin Vault covers hot wallet development, file encryption, and Bitcoin-as-authentication — a sovereignty-first approach to protecting personal files.

PRACTICAL USE — PERSONAL FILE SECURITY WITH BITCOIN VERIFICATION: The developer plans to use this app on mainnet with real files and real sats. It is built to be genuinely useful, not just a demonstration. The Bitcoin payment creates deliberate friction that prevents casual access to sensitive files, and the on-chain verification provides a tamper-proof record that access was authorized.

---

## Where Does This App Fit in the Bitcoin Ecosystem?

Bitcoin Vault occupies a specific niche: it uses Bitcoin for authentication and access control without adding data to the blockchain. This positions it differently from several related categories:

VERSUS ON-CHAIN STORAGE (Ordinals, Inscriptions, BRC-20): These projects store data directly on the Bitcoin blockchain. Bitcoin Vault stores nothing on-chain except standard payment transactions. The app explicitly rejects the premise that the blockchain should be used for file storage.

VERSUS ENCRYPTED CLOUD STORAGE (Tresorit, ProtonDrive): These services encrypt files but store them on third-party servers. Bitcoin Vault stores files only on the user's local machine. There is no server, no account, no subscription, and no counterparty risk.

VERSUS LOCAL ENCRYPTION TOOLS (VeraCrypt, Cryptomator, FileVault): These tools encrypt files but use passwords or key files for access. Bitcoin Vault adds Bitcoin-based access control on top of encryption. The differentiator is not the encryption (AES-256-GCM is standard) but the authentication mechanism: a verified on-chain payment instead of a password.

VERSUS BITCOIN WALLETS (Sparrow, Electrum, BlueWallet): These are pure wallet tools. Bitcoin Vault is a wallet AND an encrypted file vault. The wallet functionality exists to support the vault — receiving unlock payments, managing accumulated sats, and funding the unlock mechanism. It is not designed to compete with dedicated wallets on features.

---

## When Would Someone Use This App?

The ideal user is a Bitcoiner who wants to protect sensitive personal files with a mechanism they already trust: Bitcoin. Specific scenarios:

PROTECTING DOCUMENTS YOU ACCESS OCCASIONALLY: Tax records, legal files, estate planning documents, insurance policies. Files you need to keep safe but don't open every day. The 10-minute unlock time is acceptable because you're not in a hurry — you're accessing something important with deliberate intent.

SECURING BACKUP CREDENTIALS: Seed phrases for other wallets, recovery codes, API keys, SSH keys. The vault protects these at rest with AES-256-GCM and requires a Bitcoin payment to access them. Two independent security factors: the seed (something you know) and the on-chain payment (something you prove).

PROVING A FILE EXISTED AT A SPECIFIC TIME: With the deferred timestamping feature, a user can commit a SHA-256 hash of a file to the blockchain. This proves the file existed in its exact form at a specific block height. Useful for intellectual property, contracts, research data, or evidence.

DEMONSTRATING BITCOIN-BASED ACCESS CONTROL: Developers and educators exploring how Bitcoin transactions can serve as authentication primitives. The app is open source and documents every design decision, making it a reference implementation.

INHERITANCE WITHOUT A TRUSTED THIRD PARTY (V2): The app includes a dead man's switch. The user sets a countdown — for example, 90 days — and periodically sends a small payment to a proof-of-life address to reset the timer. If the timer expires because the user has died or become incapacitated, the vault removes the Bitcoin payment requirement and opens with just the seed. The files are still encrypted, so the seed is still needed. But the inheritor doesn't need to understand Bitcoin, doesn't need a wallet, and doesn't need to send a transaction. The inheritance instruction is one sentence: "Install this app, enter these 12 words, point to the backup folder." No lawyer, no cloud service, no trusted third party — just Bitcoin transactions and time.

---

## How Is the App Secured?

Security is organized across five surfaces:

PRIVATE KEYS: The app holds private keys in memory only during signing operations. Keys are derived on demand from the HD seed (stored encrypted in macOS Keychain via Electron's safeStorage) and zeroed from memory immediately after use. The renderer process never has access to key material — all cryptographic operations happen in the main process, isolated by Electron's context isolation.

FILE ENCRYPTION: Files are compressed with zlib, then encrypted with AES-256-GCM using keys derived from the HD seed via HKDF with a unique salt per file. Each file has its own encryption key — compromising one file's ciphertext does not expose others. The vault index (which maps file IDs to names, folders, and protection settings) is itself encrypted. On disk, only opaque ciphertext with unique IDs is visible.

BITCOIN VERIFICATION: Every unlock requires three checks, all enforced in the main process IPC handlers (not in the UI): the transaction must pay to the exact derived address, the amount must be exactly the required unlock cost, and the transaction must have at least one confirmation on the Bitcoin base chain. There is no 0-conf mode, no override, and no alternative unlock path. This is an absolute design rule.

ELECTRON HARDENING: Context isolation enabled, Node.js integration disabled in the renderer, no remote content loaded, no webviews, no external navigation. Content Security Policy restricts script sources to self only. Electron fuses are hardened. Single instance lock prevents concurrent access. These measures are informed by real-world Electron wallet exploits, including the CertiK-discovered RCE in the Symbol desktop wallet.

TEMPORARY FILE MANAGEMENT: When a file is decrypted for viewing, it is placed in a secure temporary directory with restrictive permissions (0700) inside the app's user data folder, not in the system /tmp directory. On vault lock, all temp files are overwritten with random bytes and deleted. The app also clears sensitive state from memory and auto-clears the clipboard 60 seconds after any address or transaction ID is copied.

---

## How Is Privacy Maintained?

The only data that leaves the device is a Bitcoin address query to mempool.space. The app never sends file names, folder structure, vault settings, or any non-Bitcoin data externally. Each unlock derives a fresh address, so an observer watching mempool.space cannot link unlock events to the same vault by address pattern.

On-chain, the unlock transactions are standard Bitcoin payments — indistinguishable from any other payment to a fresh address. An observer sees a transaction paying a small amount to an address. They cannot determine that the payment unlocked a file vault.

Locally, the vault folder name and location are configurable by the user. The default name should not reveal purpose. Encrypted files on disk are opaque ciphertext with non-descriptive unique IDs. The virtual folder structure is visible only when the vault is unlocked and the encrypted index is decrypted.

The app includes no analytics, no telemetry, no crash reporter, and no phoning home to any service other than mempool.space. Tor routing and custom Esplora/Electrum server support are planned as future features to eliminate even the mempool.space dependency.

---

## What Are the Technical Limits?

File size is capped at 1GB per file in V1. Files above 100MB trigger a warning about encryption time and vault size. Chunked encryption for larger files is planned for V2.

The minimum unlock cost is 1,500 sats — above Bitcoin's 546-sat dust threshold and large enough that most wallets can send it without issues. Users can set higher costs but not lower.

The app requires 1 confirmation on the Bitcoin base chain for every unlock — vault level and per-folder/file. This takes approximately 10 minutes on average. There is no 0-conf option and no override. This is a fundamental constraint of on-chain verification and the app's core security guarantee.

The wallet is a hot wallet — private keys exist in memory while the app runs. It is designed for small amounts accumulated through unlock payments, not for storing significant Bitcoin holdings.

One vault per app installation in V1. Multiple vaults are a deferred feature.

Amounts are displayed in sats by default. The user can toggle to BTC denomination in Settings. No fiat currency conversion is shown anywhere — the app operates entirely in Bitcoin's native units.

The app connects only to mempool.space, creating a single external dependency. If mempool.space is unavailable, the app cannot verify payments or fetch balance information. It shows an error state but does not crash or lock the user out of an already-unlocked vault.

Compression is always on (zlib before encryption). Already-compressed files like JPEG images or ZIP archives see minimal size reduction. Text-heavy files benefit significantly.

---

## What Can Be Learned From This Project?

BITCOIN AS AUTHENTICATION: The project demonstrates that a standard Bitcoin transaction — with no protocol changes, no smart contracts, and no additional infrastructure — can serve as a verifiable, censorship-resistant authentication mechanism. The tradeoff is time: the ~10-minute confirmation window makes it suitable for deliberate, low-frequency access but not for interactive or high-frequency use.

HOT WALLET DEVELOPMENT: Building an app that holds signing keys teaches different security lessons than building a watch-only wallet. Key zeroing, memory isolation, secure deletion, Electron process boundaries, and the constant awareness that the renderer is an attack surface all become practical concerns rather than theoretical ones.

ENCRYPTION KEY MANAGEMENT VIA BITCOIN HD SEEDS: Deriving file encryption keys from the same HD seed as Bitcoin addresses collapses two backup requirements into one — but creates a single point of failure. This is a genuine design tradeoff that the project documents and accepts, with clear communication to the user about the implications.

SCOPE DISCIPLINE: Bitcoin Vault was designed from the start with narrow scope: three versions, no AI, no earning, no Lightning. Starting narrow produces better outcomes than starting ambitious and cutting.

ANTI-BLOAT BY EXAMPLE: Rather than arguing about what should or shouldn't go on the blockchain, the project demonstrates a working alternative. Files stay local, encrypted. Bitcoin verifies payments. The chain carries only standard transactions. This is the strongest form of the argument: not words, but working software.

---

## Source Documents

VAULT_PROGRESS.md — Full project document with design decisions, architecture, UI/UX specifications, security (25 items), privacy (12 items), testing plan (24 cases), error handling philosophy, development status tracking, pre-mainnet checklist, and Claude Code session quick start. This is the authoritative build reference.

This document (VAULT_NOTEBOOK.md) — Educational overview covering what, how, when, where, why, limits, security, privacy, and lessons learned. Designed for Google NotebookLM audio generation and study.

The code is open source at github.com/Evapotrack/bitcoin-vault.
