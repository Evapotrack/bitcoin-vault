# Bitcoin Vault — Project Document
# For use in Claude Code sessions on 2025 MacBook Air
# Creator: Andrew Brown
# Date: April 5, 2026 | Status: Design complete, pre-development

===============================================================================
SECTION 1 — WHAT THIS APP IS
===============================================================================

A macOS desktop app that encrypts files and folders locally, unlockable only by
sending sats to an address the app controls. The vault is the wallet — one HD
seed generates receive addresses, manages balance, signs transactions, and
controls file encryption.

No cloud. No server. No AI. No API cost. Self-contained.

Three things it does:
  1. Encrypts files with AES-256-GCM, decryptable only after verified Bitcoin payment
  2. Manages its own Bitcoin wallet (receive, send, consolidate)
  3. Enforces tiered access — different sat costs and frequencies for different files/folders

This is a hot wallet. It holds private keys. It is for small amounts.
The app communicates this clearly to the user at all times.

Working title: "Bitcoin Vault" (final name TBD)
Repo: github.com/Evapotrack/bitcoin-vault
License: TBD (to be chosen before open source release)

SUMMARY:

Bitcoin Vault is an open-source macOS desktop application that encrypts your files locally and unlocks them only when a Bitcoin payment is verified on-chain with one confirmation. The app generates its own HD wallet from a 12-word BIP39 seed — the same seed that controls both your file encryption keys and your Bitcoin addresses. You send sats from any wallet to unlock your vault, and the app verifies the transaction against the Bitcoin base chain before decrypting anything. No file data ever touches the blockchain. No cloud services are involved. No third-party servers hold your keys or your files. The entire system runs on your machine, verified by the most secure settlement network ever built.

This is a tool built by a Bitcoiner for Bitcoiners. While the OP_RETURN debate rages over whether the blockchain should store arbitrary data, this app demonstrates the alternative: use Bitcoin as money, use it as an authentication layer, and keep your data on your own hardware where it belongs. The vault stores encrypted files flat on disk with a virtual folder structure in an encrypted index — an observer who accesses your drive sees only opaque ciphertext and learns nothing about what you're protecting. Every unlock derives a fresh address, so no on-chain pattern links your access events. The app is intentionally AI-free, has zero recurring API costs, and operates as a self-contained sovereignty tool: your keys, your files, your machine, verified by Bitcoin.

===============================================================================
USE CASES, LIMITS & WHAT CAN BE LEARNED
===============================================================================

USE CASES — WHERE THIS APP IS GENUINELY USEFUL:

  Personal document security. Tax records, legal documents, estate planning
  files, medical records, identity documents. Files you need to protect at
  rest but access occasionally. The Bitcoin payment creates deliberate friction
  — you don't accidentally open sensitive files. You make a conscious decision,
  pay for access, and wait for confirmation. The 10-minute unlock window is
  a feature: it forces intentional access rather than casual browsing.

  Seed phrase and credential storage. Storing encrypted backups of seed phrases,
  API keys, recovery codes, and passwords. The vault protects these at rest
  with AES-256-GCM, and the Bitcoin unlock ensures that accessing them requires
  both the vault's seed (for decryption) and a confirmed on-chain transaction
  (for authorization). Two independent factors: something you know and something
  you prove on-chain.

  Proof of file integrity over time. With the deferred timestamping feature,
  a user can anchor a SHA-256 hash of any file to the blockchain via OP_RETURN
  (32 bytes, well within the original 83-byte limit). This proves the file
  existed in its exact form at a specific block height — useful for intellectual
  property, contracts, research data, or legal evidence. The file stays local.
  Only the hash goes on-chain.

  Tiered access within a single vault. A journalist protecting sources can
  set the /sources/ folder to 5,000 sats per access while keeping /drafts/
  at vault-level cost. A developer can protect /keys/ with per-access payment
  while leaving /docs/ open once the vault is unlocked. The cost and frequency
  settings create meaningful access tiers without separate vaults.

  Self-sovereignty demonstration. For the Bitcoin community, this app is a
  working example of using Bitcoin for something beyond payments and store of
  value — without bloating the chain. It demonstrates that authentication,
  access control, and proof-of-payment can all be built on standard Bitcoin
  transactions with no protocol changes, no smart contracts, and no additional
  infrastructure beyond a mempool.space API query.

LIMITS — WHERE THIS APP IS NOT THE RIGHT TOOL:

  Large-scale file storage. V1 caps at 1GB per file and the vault is designed
  for important documents, not media libraries. If you need to encrypt
  terabytes, use VeraCrypt or FileVault.

  High-frequency access. If you need to open files 20 times a day, the
  per-access payment model costs sats and time. The app is designed for
  files you access occasionally with deliberate intent, not files you work
  with continuously. For daily-use files, set the frequency to weekly or
  monthly so a single payment covers extended access.

  Maximum security for large holdings. This is a hot wallet. Private keys
  exist in memory while the app runs. For protecting Bitcoin worth more than
  you'd carry in your physical wallet, use hardware cold storage. The vault
  wallet is for accumulated unlock payments — small amounts by design.

  Replacing established encryption tools. VeraCrypt, Cryptomator, and macOS
  FileVault are mature, audited, and battle-tested for general-purpose
  encryption. This app adds Bitcoin-based access control on top of encryption
  — that's the differentiator, not the encryption itself.

  Team or multi-user access. V1 supports one user with one seed. There is no
  shared access, no multi-signature unlock, and no role-based permissions.
  Multi-sig access is a deferred future feature.

WHAT CAN BE LEARNED FROM BUILDING AND USING THIS APP:

  Bitcoin as an authentication primitive. The project explores whether a
  standard Bitcoin transaction — with no protocol extensions — can serve as
  a reliable, verifiable, censorship-resistant authentication mechanism. The
  answer from development so far is yes, with caveats: it works, but the
  ~10-minute confirmation time makes it unsuitable for high-frequency access.
  The tradeoff between security (1-confirmation finality) and convenience
  (instant access) is fundamental and cannot be optimized away on the base
  chain. This is a real constraint that any Bitcoin-based authentication
  system will face.

  Hot wallet architecture for non-custodial applications. This app holds private keys and signs
  transactions internally. Building it teaches the practical security challenges
  of hot wallet development: key zeroing, memory management, secure deletion,
  Electron process isolation, and the constant awareness that any vulnerability
  in the renderer could escalate to key extraction. The security surface is
  meaningfully different from a watch-only app and the lessons transfer to
  any application that handles signing authority.

  File encryption integrated with Bitcoin key material. Using HKDF to derive
  file encryption keys from an HD seed is a design pattern that collapses
  two backup requirements (encryption key + wallet seed) into one (seed only).
  This is convenient but creates a single point of failure: if the seed is
  compromised, both the wallet and all encrypted files are exposed. The
  project documents this tradeoff explicitly and lets the user decide whether
  the convenience justifies the risk.

  Scope discipline applied from the start. This project began with a narrow scope informed by experience. Three versions with clear boundaries, no earning
  methods, no AI, no Lightning. The lesson: starting narrow based on prior
  project experience produces a more focused, buildable, and honest design
  than starting ambitious and cutting down.

===============================================================================
SECTION 1B — WHY THIS APP EXISTS
===============================================================================

Bitcoin is not a database.

In 2025, Bitcoin Core merged pull request #32406, removing the longstanding
83-byte OP_RETURN limit and raising it to effectively 4MB per output in
Bitcoin Core 30. This decision reignited a fundamental debate about Bitcoin's
purpose: is it a monetary network or a general-purpose data ledger?

The expansion was controversial. Luke Dashjr called it "utter insanity."
Samson Mow urged node operators to stay on Core 29 or switch to Bitcoin Knots.
Bitcoin Knots — which maintains stricter relay policies including filtering
non-payment transactions — grew to approximately 5% of all nodes. The concern
is real: unrestricted on-chain data encourages blockchain bloat, increases
storage requirements for full nodes, and risks pricing out average users from
running their own node — the very foundation of Bitcoin's decentralization.

Running a full node should remain affordable and accessible. If the blockchain
grows unchecked with arbitrary data — images, documents, media files stuffed
into transactions — the cost of storing and verifying the chain increases for
everyone. The people who lose first are individuals running nodes at home on
modest hardware. When those people can no longer participate, verification
concentrates in data centers and corporations, and Bitcoin's permissionless
nature erodes.

This app takes a different approach: store your data locally, encrypt it on
your own machine, and use Bitcoin only for what Bitcoin does best — verify
transactions. The vault doesn't put a single byte of file data on the
blockchain. It uses Bitcoin as an authentication layer: a transaction proves
you paid, the blockchain confirms it, and your local app decrypts your local
files. The chain carries only the payment — a standard, minimal Bitcoin
transaction. Your files never touch the blockchain.

A Bitcoin enthusiast who wants to secure their personal files doesn't need to
bloat the chain to do it. They need encryption, a payment, and a verification.
This app provides all three without adding a single unnecessary byte to the
blockchain that every node operator in the world must store forever.

The philosophy is simple: Bitcoin is money. Use it as money. Store your data
on your own hardware, where it belongs.

OPTIONAL — FILE TIMESTAMPING:

For users who want cryptographic proof that a file existed at a specific point
in time, the app can optionally commit a hash of the file to the blockchain.
This does not store the file on-chain — only a 32-byte SHA-256 hash embedded
in an OP_RETURN output. The hash proves the file existed at the time of the
transaction without revealing its contents. The file itself stays local.

This is the legitimate use case OP_RETURN was designed for: small, prunable
commitments. A 32-byte hash is well within even the original 83-byte limit.
No bloat. No data storage. Just a mathematical proof anchored to the most
secure timestamping system ever built.

Implementation (deferred, not V1):
  - User right-clicks a file → "Timestamp on Bitcoin"
  - App computes SHA-256 hash of the encrypted file
  - Builds a transaction with an OP_RETURN output containing the hash (32 bytes)
  - User confirms (shows fee). Transaction broadcast.
  - Vault index records the txid and block height alongside the file entry
  - User can later prove: "This exact file existed at block [height], time [date]"
  - Verification: anyone with the file can hash it and check the OP_RETURN in the tx

Use cases for timestamping:
  - Intellectual property: prove a document, design, or idea existed before a date
  - Legal: timestamp contracts, agreements, or evidence
  - Personal: prove a photo, journal entry, or record is authentic and unmodified
  - Code: timestamp a software release or audit report

===============================================================================
SECTION 2 — DESIGN DECISIONS
===============================================================================

Platform: Electron, macOS, React 19, Tailwind 4, Zustand 5
Bitcoin: bitcoinjs-lib 7, bip32 5, bip39 3, tiny-secp256k1 2, mempool.space API
Encryption: Node crypto AES-256-GCM, keys derived via HKDF from HD seed
Key storage: Electron safeStorage (macOS Keychain)
Design: dark theme, deliberately sparse.

  Palette:
    black (bg-gray-950), dark grey (bg-gray-900), medium grey (bg-gray-800),
    white text, BTC orange (orange-600) for Bitcoin actions. Red for errors,
    yellow for testnet badge. No other colors.

  Design principles:
    - More whitespace. Fewer elements per screen. One thing at a time.
    - Larger typography for key information: QR codes, sat amounts, addresses,
      and confirmation status are oversized. The lock screen is almost entirely
      a QR code and a number.
    - Fewer visible controls. The file browser shows files, not toolbars full
      of buttons. Actions are contextual (right-click, hover) not persistent.
    - The overall feeling should be calm and deliberate. A vault is quiet. You
      open it, get what you need, and close it. The UI reflects that.
    - text-lg or text-xl for sat amounts and status messages
    - Generous padding: p-6 or p-8 on major cards
    - Max-width containers on content to prevent it stretching across wide screens
Network: testnet by default during development

Seed: 12-word BIP39 mnemonic. Shown once at setup. User writes it down.
      Verify step (re-enter 3 random words) before proceeding. Never re-displayed.

Unlock: vault's HD wallet derives fresh BIP84 address per unlock. No address reuse.
        1 confirmation on Bitcoin base chain required before any decryption.
        This applies to vault-level AND per-folder/file unlocks. No exceptions.
        No 0-conf option. No override. No alternative unlock method.
        This is an absolute design rule, not a user setting.

Verification — secure and private:
        The app verifies by polling mempool.space for the derived address.
        Three mandatory checks, enforced in main process IPC:
          (1) Transaction pays to the exact derived address for this unlock
          (2) Amount is exactly the required unlock cost. Bitcoin transaction
              outputs are precise — the sender's wallet sends the exact sat
              amount specified. No tolerance needed.
              Below required: rejected. "Received X sats, need Y sats."
              Above required: rejected. "Received X sats, expected exactly Y."
              Rejected payments: sats received by vault wallet (sweepable),
              but do not trigger unlock. User sends correct amount to new address.
          (3) >= 1 confirmation (mined into a block on Bitcoin base chain)
        Only after all three pass does decryption occur. The only data sent
        externally is the address query. No file names, vault structure, or
        non-Bitcoin data ever leaves the device.

Access: user sets two parameters at vault level:
          (1) Sat amount — unlock cost (minimum 1,500 sats)
          (2) Frequency — how long vault stays unlocked after confirmed payment
              (per-session / daily / weekly / monthly / custom)
        Both set during setup wizard. Both adjustable in Settings.
        Per-folder/file settings (V2): cost + frequency + optional delete restriction.

Address validity:
        Unlock addresses stay valid until the app is closed or the user manually
        refreshes. On app restart, a new address is generated. No timeout setting.
        If a pending unlock request exists (payment sent but unconfirmed), it
        persists across restarts — the app checks for confirmation on next launch.

        If a payment arrives to an address that is no longer the active unlock
        address (app was restarted, user refreshed), the sats are received by
        the vault wallet but do not trigger an unlock. A notification appears
        on the lock screen: "Payment received to a previous address. Your sats
        are safe. Send to the current address below to unlock." This message
        persists until dismissed.

Lock screen privacy:
        The lock screen shows ONLY the QR code, address, sat amount, and
        payment status. No wallet balance, no file count, no vault name.
        Maximum privacy if someone else sees the screen.

Fund inflow:
        Sats enter the vault only through unlock payments. No separate deposit
        function. No receive address generator beyond the unlock flow. The
        wallet view shows accumulated sats and lets the user send or consolidate.

Wallet: vault IS the wallet. One HD seed. App holds private keys, signs internally.
Recovery: 12-word seed written at setup. Seed + encrypted files from backup = full restore.
Storage: ~/Documents/BitcoinVault/ (user-visible, iCloud/Time Machine compatible)
         Folder name/location configurable by user at setup.

Files on disk: encrypted files stored flat with unique IDs. Virtual folder
        structure maintained in the encrypted index. On-disk layout reveals
        nothing about organization.

Upload flow: drag or select files → staging area with X buttons to remove →
        optional per-file protection settings → "Add to Vault" → encrypt →
        "Securely delete originals?" dialog with per-file checkboxes.

File access: open with system app via secure temp directory. Temp files
        overwritten with random bytes + deleted on vault lock.

Folder creation: user creates folders inside the vault browser. Virtual
        structure only — no actual directories on disk.

Deletion: permanent, no undo. Confirmation dialog required. Optional
        "require recent payment" restriction per file/folder (set alongside
        cost and frequency).

File size: warn above 100MB. Hard ceiling 1GB in V1. Chunked encryption
        for larger files deferred to V2.

Compression: files are compressed with zlib (Node built-in) before encryption.
        Compress → encrypt on import. Decrypt → decompress on access. This
        reduces vault storage size and makes iCloud/Time Machine backups smaller.
        Text-heavy files (documents, code, CSVs) compress significantly.
        Already-compressed files (images, video, archives) see minimal reduction
        but no harm — zlib handles them gracefully. Compression happens in the
        main process before AES-256-GCM encryption. The encrypted index stores
        both the original file size and the compressed size so the vault browser
        can display the original size to the user while the actual disk usage
        is smaller. No user setting needed — compression is always on.

Vault count: one vault per app in V1. Multiple vaults deferred.

Denomination: sats by default. User can toggle to BTC in Settings. No fiat
        display anywhere. The app lives entirely in Bitcoin's native units.
        BTC format: 8 decimal places (e.g. 0.01000000 BTC). Sats format:
        comma-separated integers (e.g. 1,000,000 sats).

File types: no restrictions. The vault encrypts bytes — any file type accepted.

Deletion restriction: "require recent payment" means the user must have an
        active (non-expired) access window for that file/folder to delete it.
        If the vault unlocks every 7 days and the user paid 3 days ago, they
        can delete. If 8 days have passed and the access window expired, they
        must pay again before deleting. This prevents someone who gains
        temporary access to an unlocked vault from permanently destroying
        protected files.

Polling: the app polls mempool.space every 15 seconds when waiting for a
        payment (lock screen or protected folder unlock). Polling stops when
        the vault is unlocked and no folder unlock is pending. This balances
        responsiveness against mempool.space rate limits.

Vault folder integrity: if the vault folder is moved, renamed, or deleted
        externally while the app is running, the app detects this on the next
        file operation and shows an error: "Vault folder not found at [path].
        Check your files or update the vault location in Settings." The app
        does not crash or silently create a new empty vault.

Network: user chooses testnet or mainnet at vault creation. Mainnet is the
        primary vault. Testnet accessible via "Open Testnet" button in mainnet
        Settings — opens a completely separate window with its own seed, vault
        directory, and encrypted files. Fully isolated. Testnet vault displays
        a prominent badge (bg-yellow-600/20 text-yellow-400) on every screen.
        Mainnet UI is clean with no badge.

Notifications: no system-level macOS notifications. No background processes.
        No menu bar icon. The app is active only when open.
        IN-APP notifications appear within the app window when:
          - Vault unlock payment confirms → "Payment confirmed" (text-green-400)
            displayed briefly on lock screen, then vault transitions to file browser
          - Protected folder/file payment confirms → "Access granted to [name]"
            displayed inline in the vault browser
          - Payment received to previous address → message persists on lock screen
            until dismissed: "Payment received to a previous address. Your sats
            are safe. Send to the current address below to unlock."
        These are visual status changes within the app, not toasts or popups.
        Consistent with the sparse aesthetic.

AI: none. Intentionally AI-free. No Anthropic API, no local LLM, no agent.
        Pure Bitcoin + encryption.

License: TBD — to be decided before open source release.

Example configuration:
  Vault:              750 sats, every 7 days
    /documents/       no additional cost
    /documents/taxes/ 2,000 sats, every 30 days, delete requires recent payment
    /keys/            5,000 sats, every access, delete requires recent payment
    /photos/          no additional cost

===============================================================================
SECTION 3 — UI & UX
===============================================================================

SCREENS:

  1. Setup Wizard (first launch only)
  2. Lock Screen (default state when vault access has expired)
  3. Vault Browser (unlocked — primary view)
  4. Wallet View
  5. Settings
  6. How To

SIDEBAR (persistent when unlocked):
  - Vault (file browser — default view)
  - Wallet
  - Settings
  - How To
  - Lock button at bottom (manual re-lock)
  - Balance at bottom (always visible, font-mono, orange, follows denomination setting)
  - Network badge at top (testnet: bg-yellow-600/20 text-yellow-400)
  - Hot wallet indicator: "Hot wallet — small amounts only" (text-gray-500, persistent)

SETUP WIZARD (5 steps):

  Step 1 — Welcome: one paragraph explaining the app. Two buttons:
    "Create New Vault" — proceeds to seed generation (Step 2)
    "Restore Existing Vault" — proceeds to restore flow:
      - Enter 12-word seed (validated against BIP39 checksum)
      - Select folder containing backed-up encrypted vault files
      - App derives master key, attempts to decrypt vault index
      - If successful: vault restored, wallet scanned for UTXOs, settings
        recovered from index, vault ready
      - If failed: "Could not decrypt vault with this seed. Verify your
        words and try again."
      - If seed valid but no encrypted files found: "Wallet restored. No
        encrypted vault files found. Your wallet balance is available but
        files cannot be recovered without the encrypted vault folder."

  Step 2 — Seed display: 12 words in a numbered grid on bg-gray-900 card.
    Warning text: "Write these words on paper. This is the only time they
    will be shown." No copy button, no screenshot capability.
    Button: "I've written them down"

  Step 3 — Seed verify: "Enter word 4, word 9, word 12" (3 random positions).
    Text inputs. If wrong, return to Step 2. If correct, proceed.

  Step 4 — Vault config:
    - Network: testnet or mainnet (prominent selection, explains the difference)
    - Unlock cost: number input (min 750 sats, no default — user must choose)
    - Frequency: dropdown (every access / daily / weekly / monthly / custom)
    - Vault folder: folder picker, default ~/Documents/BitcoinVault/

  Step 5 — Confirmation: "Your vault is ready." Show vault folder location.
    Remind about backups: "Your files are encrypted and safe to back up to
    iCloud or Time Machine." Button: "Open Vault" → goes to Lock Screen.

LOCK SCREEN:

  Center: QR code (large, scannable, white on dark background)
  Below QR: address in text-gray-300 font-mono text-xs (click to copy,
    clipboard auto-clears after 60 seconds, brief "Copied" toast)
  Below address: "Send [amount] sats to unlock" in text-white text-lg
  Below amount: status line in text-gray-500
    "Waiting for payment..."
    → "Transaction detected. Waiting for confirmation..." (text-orange-400)
    → "Payment confirmed" (text-green-400, displayed 2-3 seconds)
    → vault transitions to file browser

  If payment received to a previous address: notification appears below
    status line, text-orange-400, persists until dismissed:
    "Payment received to a previous address. Your sats are safe.
    Send to the current address below to unlock."

  If access window is still valid: skip payment, show
    "Access valid until [date/time]" and unlock automatically.

  Background: bg-gray-950, centered content, minimal. Nothing else on screen.

VAULT BROWSER (unlocked):

  Top toolbar:
    - "Add Files" button (bg-orange-600, primary action)
    - "New Folder" button (bg-gray-800, secondary)
    - Path breadcrumb showing current folder location

  Staging area (appears when adding files):
    - Drag-and-drop zone: dashed border, "Drag files here or click Add Files"
    - File list below: each file shows name, size, X button to remove
    - Expandable "Set protection" section per file (cost + frequency + delete restriction)
    - "Add to Vault" button (bg-orange-600)
    - After encryption: "Delete originals?" dialog with per-file checkboxes
      and "Securely Delete Selected" / "Keep All" buttons

  File list:
    - Folder icon (gray) / file icon with lock overlay if protected
    - Columns: Name | Size | Date Added | Protection (cost or "—")
    - Protected folders/files show lock icon + sat cost in text-orange-400
    - Click folder: navigate into (or trigger unlock flow if protected + expired)
    - Click file: decrypt to temp + open with system app
    - Right-click / context menu:
        "Open" — decrypt and open with system app
        "Set Protection" — cost, frequency, delete restriction
        "Delete" — confirmation dialog (+ payment check if delete-restricted)

  All file sizes shown with appropriate units (bytes, KB, MB).
  All sat amounts in font-mono with comma formatting.

WALLET VIEW:

  Balance: large text at top, font-mono text-orange-400
    Follows denomination setting: "1,247,500 sats" or "0.01247500 BTC"

  UTXO list: bg-gray-900 cards
    Each shows: amount (font-mono), address (truncated), confirmations,
    auto-label ("Vault unlock — Apr 5", "Folder: /keys/ — Apr 8")

  Send section: bg-gray-900 card
    - Address input (font-mono, validated on blur)
    - Amount input (sats, font-mono)
    - Fee rate display (from mempool.space, text-gray-400)
    - Total with fee shown
    - "Send" button (bg-orange-600)
    - Confirmation step: "Send [amount] sats to [address]? Fee: [fee] sats. Confirm?"

  Consolidation (V3): "Consolidate [N] UTXOs" button with estimated savings shown

SETTINGS:

  Vault section:
    - Unlock cost (number input, min 750)
    - Unlock frequency (dropdown)
    - Vault folder location (folder picker + "Move Vault" action)

  Display section:
    - Denomination toggle: sats (default) or BTC

  Security section:
    - Auto-lock timer (dropdown: 5 / 10 / 15 / 30 / 60 min, default 15)

  Network section:
    - Current network indicator (Mainnet or Testnet)
    - "Open Testnet Vault" button (mainnet only — opens separate window
      with independent testnet vault. First click triggers testnet setup wizard.)

  About section:
    - Version, repo link, license

HOW TO (in-app reference):

  Full sidebar view, not a modal. bg-gray-950, text-gray-300 body text,
  text-white section headers. Sections:

    "What is this app?"
      One paragraph. Encrypted file vault unlocked by Bitcoin payments.

    "How to unlock your vault"
      Send sats to the address shown on the lock screen. Wait for 1
      confirmation (~10 minutes). The vault unlocks automatically.

    "How to add files"
      Drag files into the vault or use the Add Files button. Review your
      selection, optionally set protection per file, then submit.

    "How to access a file"
      Click a file to open it with your default macOS application. The
      file is decrypted temporarily and cleaned up when the vault locks.

    "How to protect specific files"
      Right-click a file or folder and choose Set Protection. Set a sat
      cost, access frequency, and optionally require recent payment to delete.

    "How to send sats from your vault"
      Open the Wallet view. Enter an address and amount. Review the fee
      and confirm.

    "How to back up your vault"
      Two things to protect: your 12-word seed and your encrypted files.

      YOUR SEED — write it down on paper first during setup. Then stamp
      each word into a metal plate using a center punch and letter stamps.
      Metal seed plates are sold by multiple vendors — look for stainless
      steel plates with a grid for stamping individual letters or whole
      words. Center punch style plates (where you mark each letter with
      a single punch strike on a grid) are the simplest and most durable.
      Metal survives fire, flood, and time. Paper does not.

      Store the metal plate somewhere secure and separate from your
      computer — a home safe, a bank safe deposit box, or with a trusted
      family member. Never photograph it, never type it into any device
      other than this app during recovery, never store it digitally.

      YOUR FILES — your encrypted vault folder needs its own backup.
      iCloud, Time Machine, or a manual copy to an external drive. The
      files are encrypted on disk — safe to store in the cloud. But
      without the seed, the backup is useless ciphertext.

      Seed + encrypted files = full recovery.
      Seed alone = wallet recovery (sats accessible, files not).
      Files alone = nothing (encrypted, unreadable without seed).

    "When do I need my seed?"
      Only during recovery. You will NOT need your seed for normal daily
      use — the app stores it securely in your macOS Keychain and derives
      keys automatically.

      You need your seed if:
        - Your Mac is lost, stolen, or destroyed and you're setting up
          on a new machine
        - Your macOS Keychain is corrupted or reset
        - An inheritor is accessing the vault after your dead man's
          switch has triggered
        - You're moving the vault to a different Mac

      You do NOT need your seed to:
        - Unlock the vault (that's the Bitcoin payment)
        - Send sats from your wallet
        - Add, access, or delete files
        - Change settings

      If you never experience a recovery scenario, you will never need
      to enter your seed after initial setup. But if you do need it and
      don't have it, your files and your sats are gone permanently.
      There is no recovery without the seed. No support team, no reset,
      no backdoor. This is self-custody.

    "How to recover"
      Install the app on a new machine. Choose "Restore Existing Vault."
      Enter your 12-word seed. Point to your backed-up encrypted files.
      The app derives the encryption keys, decrypts the vault index,
      scans the blockchain for wallet UTXOs, and restores your vault
      with all files, folders, and settings intact.

    "Security"
      This app holds private keys on your machine (hot wallet). It is
      designed for small amounts. For large holdings, use hardware cold
      storage. The vault encrypts your files at rest — once a file is
      decrypted for viewing, it exists temporarily on disk until the
      vault locks.

UX PRINCIPLES:
  - One primary action per screen. Lock screen: one QR code, one amount.
    File browser: files. Wallet: balance. Nothing competes for attention.
  - Sparse by default. Generous whitespace. Large type for key data.
    The app should feel like it has room to breathe.
  - Actions are contextual, not persistent. No toolbar full of buttons.
    Right-click for file actions. Hover to reveal secondary controls.
    "Add Files" and "New Folder" are the only persistent toolbar items.
  - No modals except deletion confirmation and original file deletion prompt.
  - All sat amounts: toLocaleString() + "sats" label, font-mono, text-lg or text-xl.
  - Loading states: text-gray-500 animate-pulse text, no spinners.
  - Error states: bg-red-900/20 border-red-800 text-red-400.
  - Confirmation on lock screen: text-orange-400 during wait, text-green-400 on confirm.
  - No gradients, no shadows, no rounded-full buttons.
  - rounded-lg for cards, rounded for inputs/buttons.
  - Max-width on content areas (max-w-2xl or max-w-3xl) to prevent stretching.
  - p-6 or p-8 padding on major cards and sections.
  - The overall tempo is slow and deliberate. The 10-minute confirmation wait
    is not a bug — it's the pace of the app. Nothing rushes.

ERROR HANDLING PHILOSOPHY:
  The app handles errors by stopping and telling the truth. Never silently
  fail. Never show stale data as current. Never guess.

  Rules:
  - Financial operations (send, broadcast): if anything fails, abort entirely
    and show the error. Never partially execute a transaction. "Send failed:
    [reason]" is always better than a silent partial spend.
  - Encryption: if encryption fails mid-file, do not add the file to the vault
    index and do not offer to delete the original. The original must survive
    any encryption failure. "Encryption failed for [filename]: [reason]" shown
    in the staging area.
  - Decryption: if a file fails to decrypt (corrupted ciphertext, wrong key),
    show the error on that specific file. Do not prevent access to other files
    in the vault. "Could not decrypt [filename]. The file may be corrupted."
  - mempool.space API: if the API is unreachable, show "Cannot connect to
    mempool.space. Check your internet connection." on the lock screen. Do not
    show zero balance. Do not lock the user out of an already-unlocked vault —
    API failure during an active session does not trigger re-lock.
  - safeStorage / Keychain: if the Keychain is unavailable or corrupted,
    show "Cannot access secure storage. Your macOS Keychain may be locked or
    unavailable." The app cannot function without safeStorage — this is a
    blocking error on launch.
  - Vault folder missing: if the vault directory is gone, show recovery
    instructions, not a crash. (Already specified in Section 2.)
  - General principle: every error message should tell the user what happened,
    what data is safe, and what to do next.

===============================================================================
SECTION 4 — ARCHITECTURE
===============================================================================

  src/
    index.ts              — Main process: IPC handlers, lifecycle
    preload.ts            — Context bridge
    renderer.ts / App.tsx — React entry + root
    keychain.ts           — safeStorage (seed, vault config)
    vault/
      encryption.ts       — zlib compress/decompress + AES-256-GCM encrypt/decrypt, HKDF key derivation
      index.ts            — Config, protection settings, access timestamp tracking
      files.ts            — File import, staging, original deletion, temp management
    bitcoin/
      wallet.ts           — HD seed generation, BIP84 derivation, key management
      utxo.ts             — UTXO fetching from mempool.space
      fees.ts             — Fee estimation
      transactions.ts     — Build, sign, broadcast (full signing, not PSBT)
      monitor.ts          — Watch for incoming unlock payments, poll for 1 conf
    store/vaultStore.ts   — Zustand state
    components/
      SetupWizard.tsx     — 5-step first launch flow
      LockScreen.tsx      — QR + address + amount + confirmation status
      Sidebar.tsx         — Navigation, balance, network badge, lock button
      VaultBrowser.tsx    — File/folder browser, staging area, drag-drop
      WalletView.tsx      — Balance, UTXOs, send
      SettingsView.tsx    — Vault config, security, network, about
      HowTo.tsx           — In-app reference guide
    types/

Core flows:
  1. Setup: generate 12-word seed → display → verify 3 words → set cost +
     frequency + folder location → create vault directory + encrypted index
  2. Unlock vault: derive fresh address → show QR + amount → poll mempool.space
     → 1 confirmation → decrypt vault index → show file browser
  3. Add files: drag/select → staging with X buttons → optional per-file
     protection → compress (zlib) → encrypt (AES-256-GCM) → ask about
     deleting originals (per-file checkboxes)
  4. Access file: decrypt to secure temp dir → decompress → open with
     system app → overwrite + delete temp on vault lock
  5. Protected folder: derive fresh address → QR + amount → 1 conf → decrypt
  6. Send sats: enter address + amount → validate → build tx → sign → show
     fee → confirm → broadcast
  7. Consolidate (V3): combine small UTXOs → sign → broadcast at low fees
  8. Lock: overwrite all temp files with crypto.randomBytes → delete →
     clear sensitive state from Zustand → show lock screen
  9. Restore: enter 12-word seed → validate BIP39 checksum → select
     encrypted folder → derive master key → decrypt index → scan wallet
     for UTXOs → restore vault settings from index → ready

Versioning and migration:
  The encrypted vault index includes a version field (integer, starting at 1).
  On every launch, the app checks the index version against the app's expected
  version. If the index version is older, the app migrates it forward
  automatically (e.g., V1 index gains per-file protection fields with defaults
  when opened by V2 app). If the index version is newer than the app, show:
  "This vault was created with a newer version. Please update the app."
  Migration is always non-destructive — the original encrypted index is backed
  up before any migration is applied. This prevents data loss if a migration
  has a bug.

===============================================================================
SECTION 5 — SECURITY CONSIDERATIONS
===============================================================================

CRITICAL — Private Keys:

  S1: Keys in memory. Derive on demand, zero after signing. Private keys
      exist only in main process, only during signing, overwritten after.
      Renderer never sees key material.

  S2: Seed at rest. Stored encrypted via safeStorage (macOS Keychain).
      Hot wallet — user warned to keep amounts small.

  S3: Seed display. Shown once at setup. Verify step (3 random words).
      Never shown again. Lost backup = new vault + manual file migration.

  S4: No seed re-display. Mnemonic not retained after setup. Only derived
      keys stored. Standard practice.

CRITICAL — File Encryption:

  S5: AES-256-GCM with HKDF from HD seed. One seed backs up Bitcoin + encryption.

  S6: Per-file encryption keys. Master key + file ID as HKDF input.
      Cracking one file doesn't expose others.

  S7: Encrypted index. File paths, protection settings, timestamps all
      encrypted. Structure not visible without seed.

  S8: Temp files. Decrypted to secure temp directory, overwritten with
      crypto.randomBytes on lock, then deleted. No plaintext on disk when locked.

IMPORTANT — Bitcoin:

  S9: Address validation (toOutputScript + network prefix check).
  S10: Amount validation (no dust, no negative, no exceeding balance minus fee).
  S11: Fee ceiling default 100 sat/vB. Show fee before confirming.
  S12: Unlock verification — three mandatory checks enforced in main process IPC:
       (a) Transaction pays to exact derived address for this unlock request
       (b) Amount is >= the required unlock cost. Overpayment accepted.
           Below: rejected — sats received by vault wallet but do not
           trigger unlock.
       (c) >= 1 confirmation on Bitcoin base chain
       No 0-conf. No override. No alternative path. Enforced in code, not UI.
  S13: Replay protection. Each txid logged. Same txid cannot unlock twice.
       Each address used once — marked after successful or expired unlock.

IMPORTANT — Electron:

  S14: contextIsolation true, nodeIntegration false, preload for all IPC.
       This is the #1 Electron vulnerability — CertiK found RCE in Symbol
       wallet and MyCrypto wallet due to nodeIntegration being enabled.
       The renderer must NEVER have direct Node.js access.
  S15: Block navigation to external URLs. Block new window creation.
       Electron fuses hardened (RunAsNode disabled, CookieEncryption enabled,
       NodeOptions disabled, CLI inspect disabled). The CertiK Symbol wallet
       exploit worked because the app navigated to an external URL within the
       Electron window, allowing XSS → RCE escalation.
  S16: Single instance lock (app.requestSingleInstanceLock). Two instances
       accessing the same vault corrupt the encrypted index.
  S17: Content Security Policy (CSP). Set restrictive CSP headers:
       default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
       connect-src 'self' https://mempool.space. Prevents injection of external
       scripts even if XSS is found.
  S18: ASAR integrity. Package app code in asar archive. While asar can be
       unpacked by a local attacker, it prevents casual tampering. Do not store
       secrets in asar or any bundled files.
  S19: No remote content. The app loads only local HTML/JS. No remote URLs,
       no webviews, no iframes loading external content. All data from
       mempool.space is fetched via API calls in the main process, not loaded
       in the renderer.
  S20: Dependency audit. Pin all dependency versions in package-lock.json.
       Run npm audit before each release. The Atomic Wallet hack (2023) was
       enabled by a malicious npm package that hijacked transaction outputs.
       Review every dependency's source for a project handling private keys.

IMPORTANT — Additional Wallet Security:

  S21: Entropy source. Seed generation uses crypto.randomBytes(16) for 128
       bits of entropy. Verify this is sourced from the OS CSPRNG, not
       Math.random() or any deterministic source.
  S22: Address derivation verification. On first launch, derive the first
       5 addresses and display them. The user can verify these match the
       expected BIP84 derivation path (m/84'/0'/0'/0/0 through 0/4) using
       an external tool like Ian Coleman's BIP39 tool. This catches bugs in
       the derivation code before real funds are involved.
  S23: Transaction building verification. Before broadcasting any transaction,
       display: all inputs (txid:vout, amount), all outputs (address, amount),
       fee (in sats and sat/vB), and total in vs total out. The user confirms
       these match their intent. This prevents output-swapping attacks where
       malware modifies the destination address.
  S24: No blind signing. The user sees every detail of every transaction before
       the app signs and broadcasts. This app signs internally — so the confirmation step
       in the app IS the only review the user gets. It must be thorough.
  S25: Secure file deletion. When overwriting originals or temp files, use
       crypto.randomBytes to overwrite the file contents, then fs.unlinkSync.
       On macOS with APFS, single-pass overwrite is sufficient as APFS does
       not journal file contents (unlike HFS+).

===============================================================================
SECTION 6 — PRIVACY CONSIDERATIONS
===============================================================================

  P1: mempool.space sees queried addresses. Only data leaving the device.
      Never sends file names, vault structure, or non-Bitcoin data.
      Tor deferred. Custom Esplora backend as future option.
  P2: Fresh address per unlock. No address-based correlation between unlocks.
  P3: Consolidation links addresses on-chain. Tradeoff documented for user.
  P4: Vault folder name/location configurable. Default should not reveal purpose.
  P5: Auto-lock timer (default 15 min). Clears temp files + memory.
  P6: Memory wipe on lock — clear balances, UTXOs, addresses from Zustand.
  P7: Clipboard auto-clear 60 seconds after copying address or txid.
  P8: No real seeds, addresses, or file names in code or docs.
  P9: .gitignore covers vault data, encrypted index, temp files, logs.
  P10: Audit git history before public.
  P11: No analytics, telemetry, or crash reporting. The app phones home to
       mempool.space only. No Sentry, no Google Analytics, no Electron
       crash reporter. If debugging is needed, structured local logs only
       (never containing seeds, keys, addresses, amounts, or file names).
  P12: Secure temp directory path. Use a subdirectory of the app's userData
       directory, not /tmp (which is world-readable on macOS). Name it
       something non-descriptive. Set restrictive permissions (0700).

===============================================================================
SECTION 7 — TESTING PLAN
===============================================================================

CATASTROPHIC (loss of files or funds):
  C1: Encryption key derivation produces different keys from same seed
      → verify deterministic: same seed + same file ID = same key, always
  C2: Decryption fails on valid encrypted file → test with files of various
      types and sizes, including boundary cases (0 bytes, 1 byte, exactly
      100MB, exactly 1GB)
  C3: Seed backup cannot restore vault → generate seed, encrypt files,
      delete app data, restore from seed, verify all files decrypt correctly
  C4: Transaction sent to wrong address → verify address validation catches
      network mismatch (testnet address on mainnet and vice versa), invalid
      checksums, and non-bech32 formats
  C5: Entire wallet balance sent accidentally → verify amount validation
      prevents sending more than balance minus fee, prevents negative amounts,
      prevents zero amounts
  C6: Original files deleted but encryption failed → verify encryption
      completes fully BEFORE the "delete originals?" dialog appears. If
      encryption fails mid-file, no originals are deleted.

SEVERE (security bypass or data exposure):
  S-T1: Unlock without payment → attempt to access vault index or files
        without a confirmed transaction. Verify IPC handlers reject all
        decryption requests when unlock state is false.
  S-T2: Replay attack → send same txid to attempt second unlock beyond
        frequency window. Verify txid dedup rejects it.
  S-T3: Wrong amount accepted → send 749 sats to 750-sat vault. Send 751.
        Verify only exact amount triggers unlock.
  S-T4: Expired address payment → send to an address after app restart.
        Verify sats received but unlock not triggered. Verify lock screen
        message appears.
  S-T5: Keys accessible from renderer → attempt to access private key
        material via window.bitcoinVault API. Verify preload exposes no
        key-related methods. Inspect Zustand store for leaked key data.
  S-T6: Temp files survive lock → lock vault, inspect temp directory,
        verify all decrypted files are overwritten and deleted.
  S-T7: XSS → RCE escalation → verify no user-controlled content is
        rendered as HTML without sanitization. All file names, addresses,
        and amounts displayed as text content, never innerHTML.

MODERATE (functionality or UX failures):
  M1: mempool.space API unavailable → verify app shows error state, does
      not crash, does not show zero balance, does not lock user out of
      already-unlocked vault
  M2: Large file encryption performance → test with 100MB and 1GB files,
      verify UI remains responsive (or shows progress indicator)
  M3: Concurrent file operations → add files while another encryption is
      in progress. Verify no index corruption.
  M4: App closed during confirmation wait → close app, reopen, verify
      pending unlock request is checked and resumed if confirmed
  M5: Vault folder manually moved or renamed → verify app detects missing
      vault directory and shows recovery instructions, not a crash
  M6: Network switch confusion → verify testnet vault cannot interact with
      mainnet addresses, and vice versa. Verify testnet and mainnet windows
      are fully isolated.

MINOR (polish and edge cases):
  U1: File with special characters in name → spaces, unicode, emoji, very
      long names. Verify encryption, display, and opening all work.
  U2: Empty vault display → verify file browser shows helpful empty state,
      not a blank screen
  U3: QR code scannability → test QR codes at various screen sizes and
      brightness levels with multiple wallet apps
  U4: Denomination toggle → switch between sats and BTC in Settings,
      verify all displays update correctly with proper formatting
  U5: Auto-lock during file access → verify that if auto-lock fires while
      a decrypted file is open in a system app, the temp file is still
      cleaned up (may need to close the file handle first)

PHASES: 1-Static analysis (types, lint), 2-Unit tests (encryption, derivation,
validation), 3-Integration on testnet (full unlock flow, send flow),
4-Adversarial (bypass attempts, malformed inputs), 5-Pre-mainnet checklist

===============================================================================
SECTION 8 — DEVELOPMENT STATUS
===============================================================================

  V1 — Core Vault + Wallet                              Status
  ──────────────────────────────────────────────────────────────
  Electron scaffold + forge config                      [ ]
  HD seed generation (12-word BIP39) + safeStorage      [ ]
  Setup wizard (create new + restore existing paths)    [ ]
  AES-256-GCM encryption module + HKDF key derivation   [ ]
  zlib compression (compress before encrypt, decompress after decrypt) [ ]
  Vault directory creation + encrypted index            [ ]
  Lock screen (QR, address, amount, confirmation status)  [ ]
  mempool.space payment monitor (poll for 1 conf)       [ ]
  Decrypt vault index on confirmed payment              [ ]
  Sidebar (nav, balance, network badge, lock button)    [ ]
  File browser (folders, files, icons, sizes, dates)    [ ]
  File staging area (drag/select, X to remove, submit)  [ ]
  File encryption on import                             [ ]
  "Delete originals?" dialog with per-file checkboxes   [ ]
  File access (decrypt to temp, open with system app)   [ ]
  Folder creation inside vault browser                  [ ]
  File/folder deletion with confirmation dialog         [ ]
  Wallet: balance display                               [ ]
  Wallet: UTXO list with auto-labels                    [ ]
  Wallet: send to external address (with validation)    [ ]
  Auto-lock timer + temp file cleanup (overwrite+delete)  [ ]
  Single instance lock                                  [ ]
  Context isolation + Electron fuses                    [ ]
  CSP headers (S17)                                     [ ]
  No remote content / no webviews (S19)                 [ ]
  Hot wallet warning indicator in sidebar               [ ]
  How To page (in-app reference)                        [ ]
  File size warning (>100MB) + hard ceiling (1GB)       [ ]
  Address derivation verification on first launch (S22) [ ]
  Transaction detail display before broadcast (S23-S24) [ ]

  Security Hardening                                    Status
  ──────────────────────────────────────────────────────────────
  S1: Zero private keys from memory after signing       [ ]
  S17: Content Security Policy headers                  [ ]
  S19: No remote content loaded in renderer             [ ]
  S20: npm audit + dependency pin review                [ ]
  S21: Verify crypto.randomBytes entropy source          [ ]
  S22: Address derivation verification step             [ ]
  S23: Full transaction detail display before signing   [ ]
  S25: Secure file deletion (overwrite + unlink)        [ ]
  P11: No analytics/telemetry/crash reporter            [ ]
  P12: Secure temp directory with 0700 permissions      [ ]

  Testing                                               Status
  ──────────────────────────────────────────────────────────────
  C1-C6: Catastrophic tests pass                        [ ]
  S-T1 to S-T7: Security bypass tests pass              [ ]
  M1-M6: Moderate functionality tests pass              [ ]
  U1-U5: Minor edge case tests pass                     [ ]

  V2 — Tiered Protection + Dead Man's Switch             Status
  ──────────────────────────────────────────────────────────────
  Per-folder/file cost + frequency settings             [ ]
  Per-folder/file deletion restriction (require payment)  [ ]
  Lock icons in file browser with sat cost display      [ ]
  Separate unlock flow per protected item               [ ]
  Per-file encryption keys (HKDF with unique file ID)   [ ]
  Dead man's switch:                                    [ ]
    User sets a countdown (e.g. 90 days) in Settings.
    User sends 750 sats to a proof-of-life address to reset the timer.
    App checks the address on every launch.
    If countdown expires (no payment in N days), the vault removes
    the Bitcoin payment requirement and opens with seed only.
    Files remain encrypted — seed still needed to decrypt.
    The switch downgrades from two-factor (seed + payment) to
    single-factor (seed only). Inheritance instruction becomes:
    "Install the app, enter these 12 words, point to the backup folder."
    Implementation: one timestamp in safeStorage (last proof-of-life),
    one check on launch, one setting (countdown days, 0 = disabled).

  V3 — Wallet Features                                  Status
  ──────────────────────────────────────────────────────────────
  UTXO consolidation at low fees                        [ ]
  UTXO labeling (auto-label by unlock event + folder)   [ ]
  Fee estimation display                                [ ]
  Transaction history                                   [ ]

  Open Source Prep                                      Status
  ──────────────────────────────────────────────────────────────
  README (see outline below)                            [ ]
  LICENSE (TBD)                                         [ ]
  .gitignore verified complete                          [ ]
  Git history audit (no seeds, keys, real data)         [ ]
  No cross-references to other projects in public content [ ]
  Fresh clone + npm install + npm start passes          [ ]

  Pre-Mainnet Gate (ALL must pass before real sats/files)
  ──────────────────────────────────────────────────────────────
  All S1-S25 security items implemented                 [ ]
  All P1-P12 privacy items implemented                  [ ]
  All C1-C6 catastrophic tests pass                     [ ]
  All S-T1 to S-T7 security bypass tests pass           [ ]
  Seed backup → full restore cycle verified             [ ]
  Transaction building verified against external tool   [ ]
  Address derivation verified against Ian Coleman BIP39 [ ]
  24hr run on testnet without crash or leak             [ ]
  npm audit clean (no known vulnerabilities)            [ ]
  Encrypted index versioning implemented                [ ]
  Error handling tested for all failure modes           [ ]

  README OUTLINE (for open source release):
    - What this app does (one paragraph: encrypted vault, Bitcoin unlock)
    - How it works (send sats → 1 confirmation → decrypt)
    - What it doesn't do (no cloud, no AI, no blockchain data storage)
    - Philosophy (Bitcoin is money — store data locally, not on-chain)
    - Security model (hot wallet, one HD seed, local AES-256-GCM encryption)
    - How to install (prerequisites, npm install, npm start)
    - How to use (setup wizard, lock/unlock, add files, send sats)
    - How to back up (seed + encrypted folder = full recovery)
    - Warnings (hot wallet for small amounts, experimental software)
    - License (TBD)
    - Contributing guidelines

  Future (deferred)                                     Status
  ──────────────────────────────────────────────────────────────
  File timestamping (SHA-256 hash in OP_RETURN, 32 bytes)  [ ]
  Time-locked release                                   [ ]
  Multi-signature access                                [ ]
  Lightning unlock payments                             [ ]
  Tor routing                                           [ ]
  Custom Esplora backend                                [ ]
  Multiple vaults per app                               [ ]
  Chunked encryption for files >1GB                     [ ]

===============================================================================
SECTION 9 — OPEN QUESTIONS
===============================================================================

  1. One vault or multiple vaults per app — deferred, revisit after V1.

  2. Large file chunked encryption — deferred to V2. V1 caps at 1GB.

  3. Adding files while vault is locked — should be possible. Encryption
     key derivable from seed without decrypting the index. Index updated
     on next unlock.

  4. Payment sent but app closed before confirmation — persist pending
     unlock requests in safeStorage. On next launch, check if payment
     confirmed. Resume unlock if confirmed.

  RESOLVED:
  - Wrong amount sent → strict exact matching, sats received but no unlock,
    message shown with received vs required amount. (See Verification in Section 2)
  - Testnet vs mainnet → user chooses at vault creation. Testnet accessible
    from mainnet Settings as isolated window. (See Network in Section 2)

===============================================================================
SECTION 10 — CLAUDE CODE SESSION QUICK START
===============================================================================

  1. Dir: ~/Desktop/bitcoin-vault-project/bitcoin-vault/
  2. Network: testnet
  3. Main: src/index.ts | Renderer: src/App.tsx
  4. State: src/store/vaultStore.ts
  5. Vault: src/vault/{encryption,index,files}.ts
  6. Bitcoin: src/bitcoin/{wallet,utxo,fees,transactions,monitor}.ts
  7. Components: src/components/{SetupWizard,LockScreen,Sidebar,VaultBrowser,WalletView,SettingsView,HowTo}.tsx
  8. Run: npm start | Type check: npx tsc --noEmit
  9. Secrets: macOS Keychain via safeStorage — never in .env or code
  10. This document is the authoritative reference. Read before implementing.
  11. This is a standalone project.
