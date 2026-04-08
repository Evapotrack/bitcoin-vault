# Bitcoin Vault — Critical Review

*Written from the perspective of a Bitcoin podcaster and researcher evaluating this project honestly.*

---

## What This Project Claims To Do

Bitcoin Vault claims to encrypt files locally and gate access behind on-chain Bitcoin payment verification. One HD seed controls both the wallet and the encryption keys. No cloud, no AI, no recurring costs. The only external dependency is mempool.space.

## What It Actually Does Well

**The philosophy is sound.** In a post-OP_RETURN-expansion world, demonstrating that you can build useful Bitcoin-authenticated software without touching the blockchain with arbitrary data is a legitimate contribution. The app stores zero non-payment data on-chain. This is the right approach.

**The security model is well-considered for a V1.** Three mandatory payment verification checks enforced in the main process (not the UI), replay protection via txid logging, fresh BIP84 address per unlock, and per-file HKDF encryption keys. The Electron hardening (context isolation, no nodeIntegration, fuses set) reflects awareness of real-world Electron wallet exploits.

**The "hot wallet — small amounts only" framing is honest.** The app doesn't pretend to be cold storage. It communicates its limitations clearly and repeatedly. This is refreshing in a space full of overconfident security claims.

**AES-256-GCM + HKDF is the right encryption choice.** Per-file keys prevent a single compromise from exposing the entire vault. Compression before encryption is correct ordering. The vault index itself is encrypted.

## Where It Falls Short

**The ~10 minute unlock time is a real UX barrier.** The project frames this as a feature ("deliberate access"), but let's be honest: most users will find this frustrating after the novelty wears off. If you need to access a file urgently, you're waiting for a block. There is no way around this without introducing 0-conf, which the project correctly refuses to do.

**mempool.space is a single point of failure.** The entire unlock mechanism depends on one third-party API. If mempool.space goes down, you cannot unlock your vault. The app handles this gracefully (shows error, doesn't crash), but the dependency is real. Running your own Esplora/Electrum backend is listed as a future feature but isn't implemented.

**The "one seed controls everything" design is a double-edged sword.** Convenient for backup (one thing to protect), but catastrophic if compromised (wallet AND all files exposed simultaneously). This is documented honestly, but it's still a significant architectural risk that most encryption tools avoid.

**No audit.** This is experimental software built by a solo developer with AI assistance. It has not been professionally audited. The encryption primitives (AES-256-GCM, HKDF, BIP39/BIP84) are standard and well-tested, but the integration code — key management, memory zeroing, IPC boundaries, temp file cleanup — has not been reviewed by a cryptographer.

**Electron is inherently a larger attack surface than a native app.** The app bundles Chromium and Node.js. Even with hardening, the attack surface is orders of magnitude larger than a purpose-built native encryption tool. This is a trade-off of the Electron ecosystem, not a flaw unique to this project, but it's worth stating.

**The wallet functionality is minimal.** Basic send with largest-first coin selection. No coin control, no fee bumping (RBF), no UTXO labeling beyond auto-labels. Adequate for a vault that accumulates small unlock payments, but not competitive as a standalone wallet.

## The Bitcoin Question

**Is Bitcoin actually necessary here?** The encryption works without Bitcoin. AES-256-GCM with a password-derived key would protect files identically. What Bitcoin adds is:

1. **Economic friction** — a real cost to access, not just a password. Genuine, but marginal.
2. **On-chain proof of access** — each unlock is a timestamped blockchain transaction. Interesting for auditability but niche.
3. **Self-custody wallet** — sats accumulate with no intermediary. Real but tiny amounts.

The honest answer is that Bitcoin makes this project *interesting* and *different*, but it doesn't make the encryption meaningfully stronger. The core value proposition is the encryption, not the Bitcoin integration.

## Who Should Use This

- Bitcoiners who want to experiment with Bitcoin-as-authentication
- Developers studying Electron security, BIP84 wallet implementation, or HKDF key derivation
- People who enjoy the deliberate friction of paying to access their own files

## Who Should Not Use This

- Anyone needing reliable, fast access to encrypted files (use VeraCrypt)
- Anyone storing significant Bitcoin (use a hardware wallet)
- Anyone requiring audited encryption software (this isn't audited)
- Anyone uncomfortable with a single seed controlling both wallet and files

## Verdict

Bitcoin Vault is a thoughtful experiment that asks a genuine question: can Bitcoin transactions serve as an authentication mechanism for local file encryption? The answer is "yes, with significant UX trade-offs." The implementation is competent, the security model is honest about its limitations, and the philosophy is aligned with Bitcoin's monetary purpose.

It is not production-ready software for protecting irreplaceable files. It is a well-documented reference implementation of an interesting idea, built with discipline and honest self-assessment. In a space dominated by vaporware and overpromise, that counts for something.

**Rating: Experimental — interesting concept, honest execution, real limitations.**
