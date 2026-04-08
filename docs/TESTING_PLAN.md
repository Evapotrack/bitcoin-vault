# Bitcoin Vault — Testing Plan

*Pre-release testing checklist organized by severity.*

---

## Prerequisites

- macOS with Node.js installed
- `npm start` launches successfully
- Testnet mode (default)
- Testnet faucet sats available (e.g., coinfaucet.eu/en/btc-testnet)

---

## Catastrophic Tests (Must Pass Before Any Mainnet Use)

### C1: Encryption Key Determinism
**What:** Same seed + same file ID always produces the same encryption key.
**Procedure:**
1. Create vault with known seed
2. Import a test file
3. Note the file ID from the vault index
4. Close app, relaunch, unlock
5. Verify the file decrypts correctly
6. Uninstall app, reinstall, restore from seed + backup folder
7. Verify the same file still decrypts correctly

**Pass:** File decrypts identically after full restore.
**Fail:** File corrupted or unreadable after restore.

### C2: File Decryption Integrity
**What:** Encrypted files decrypt to exact original content across file types.
**Procedure:**
1. Import files of various types: .txt, .pdf, .jpg, .zip, .json
2. Import a file close to 100 MB
3. Open each file from the vault browser
4. Compare opened file to original (byte-for-byte if possible)

**Pass:** All files match originals exactly.
**Fail:** Any file corrupted, truncated, or altered.

### C3: Full Backup/Restore Cycle
**What:** Seed + encrypted folder = complete recovery.
**Procedure:**
1. Create vault, add 5+ files in 2+ folders
2. Send a test transaction from the wallet
3. Record: file count, folder structure, wallet balance
4. Close app completely
5. Delete app data (not vault folder)
6. Relaunch, choose "Restore Existing Vault"
7. Enter seed, point to vault folder
8. Verify: all files present, folders intact, balance recovered

**Pass:** Everything matches pre-restore state.
**Fail:** Any file, folder, or balance missing.

### C4: Payment Verification — Correct Amount
**What:** Vault unlocks only on exact amount with 1 confirmation.
**Procedure:**
1. Lock vault, note required unlock amount
2. Send exact amount to displayed address
3. Wait for 1 confirmation
4. Verify vault unlocks

**Pass:** Vault unlocks after 1 confirmation.
**Fail:** Vault does not unlock, or unlocks before confirmation.

### C5: Payment Verification — Wrong Amount Rejected
**What:** Sending wrong amount does not unlock vault.
**Procedure:**
1. Lock vault (e.g., 750 sats required)
2. Send 749 sats to address — verify NO unlock
3. Send 751 sats to address — verify NO unlock
4. Verify sats received by wallet but vault stays locked

**Pass:** Vault stays locked on wrong amounts. Sats in wallet.
**Fail:** Vault unlocks on wrong amount.

### C6: Original File Safety
**What:** "Delete originals" only runs when user explicitly confirms.
**Procedure:**
1. Import a file with "delete original" unchecked
2. Verify original still exists on disk
3. Import another file with "delete original" checked
4. Verify original is securely deleted (not in Trash)

**Pass:** Delete only when explicitly requested.
**Fail:** Original deleted without consent, or not deleted when requested.

---

## Security Tests (Must Pass Before Mainnet)

### S1: Unlock Without Payment Rejected
**What:** No code path allows vault access without confirmed payment.
**Procedure:**
1. Lock vault
2. Attempt to navigate directly to vault browser (if possible via dev tools)
3. Verify vault index remains encrypted and inaccessible

**Pass:** No access without payment.
**Fail:** Any file or index accessible while locked.

### S2: Replay Attack Protection
**What:** Same txid cannot unlock twice.
**Procedure:**
1. Unlock vault with payment (note txid)
2. Lock vault
3. Attempt to use same txid for second unlock (manipulate if needed via dev tools)

**Pass:** Second unlock rejected.
**Fail:** Same txid accepted twice.

### S3: Renderer Cannot Access Keys
**What:** No key material visible in renderer process.
**Procedure:**
1. Open dev tools while vault is unlocked
2. Inspect: `window.bitcoinVault` — verify no seed/key methods
3. Check Zustand store — verify no seed or private key data
4. Check Network tab — verify no key material in IPC responses
5. Check Console — verify no key material logged

**Pass:** Zero key material accessible from renderer.
**Fail:** Any seed, private key, or master key visible.

### S4: Temp File Cleanup on Lock
**What:** All decrypted temp files destroyed on vault lock.
**Procedure:**
1. Unlock vault, open 3 files (creates temp decrypted copies)
2. Note temp directory location (app userData/vault-temp/)
3. Verify temp files exist while unlocked
4. Lock vault
5. Check temp directory — should be empty

**Pass:** All temp files gone after lock.
**Fail:** Any temp file remains.

### S5: Address Derivation Verification
**What:** First 5 derived addresses match BIP84 spec.
**Procedure:**
1. During setup, note the 12-word seed
2. After setup, check the 5 displayed addresses
3. Verify against Ian Coleman's BIP39 tool (iancoleman.io/bip39) using same seed, BIP84 path

**Pass:** All 5 addresses match.
**Fail:** Any address mismatch.

### S6: Transaction Detail Before Broadcast
**What:** Full transaction details shown before user confirms send.
**Procedure:**
1. Build a send transaction in Wallet view
2. Click "Review Transaction"
3. Verify displayed: all inputs (txid:vout, amount), all outputs (address, amount), fee (sats + sat/vB)
4. Verify amounts add up (totalIn = totalOut + fee)

**Pass:** Complete, accurate transaction detail shown.
**Fail:** Missing inputs, outputs, or fee information.

---

## Moderate Tests

### M1: mempool.space Unavailable
**What:** App handles API downtime gracefully.
**Procedure:**
1. Disconnect from internet (or block mempool.space)
2. Attempt to unlock vault — verify error message, no crash
3. Open Wallet view — verify shows last known balance or 0
4. Reconnect — verify recovery without restart

**Pass:** Graceful error handling, no crash, no data loss.
**Fail:** App crashes or corrupts data.

### M2: Large File Performance
**What:** Files near the 1 GB limit work without hanging.
**Procedure:**
1. Import a 500 MB file
2. Verify import completes (may be slow)
3. Open the file from vault
4. Verify it opens correctly

**Pass:** Large file imports and opens (slow is acceptable).
**Fail:** App hangs, crashes, or corrupts the file.

### M3: App Close During Payment Wait
**What:** No data loss if app closed while waiting for payment.
**Procedure:**
1. Lock vault, payment screen displayed
2. Close app (Cmd+Q) before payment confirms
3. Relaunch app
4. Verify vault is still locked and functional

**Pass:** Vault intact, can unlock normally.
**Fail:** Vault corrupted or stuck state.

### M4: Settings Persistence
**What:** Changed settings survive lock/unlock cycle.
**Procedure:**
1. Change denomination to BTC
2. Change auto-lock to 30 min
3. Lock vault, unlock again
4. Verify settings retained

**Pass:** Settings match what was set.
**Fail:** Settings reverted to defaults.

---

## Minor Tests

### U1: Special Characters in Filenames
**What:** Files with unicode, spaces, emoji in names work.
**Procedure:** Import files named: `résumé.pdf`, `my file (copy).txt`, `日本語.doc`
**Pass:** All import and display correctly.

### U2: Empty Vault State
**What:** App displays correctly with no files.
**Procedure:** Create new vault, unlock, verify vault browser shows empty state message.
**Pass:** "Vault is empty" message displayed.

### U3: QR Code Scannability
**What:** Lock screen QR code scans with a phone wallet.
**Procedure:** Scan QR with Strike, Muun, or BlueWallet.
**Pass:** Wallet shows correct address and amount.

### U4: Denomination Toggle
**What:** Switching sats/BTC updates all displays.
**Procedure:** Toggle denomination in Settings, check sidebar balance and wallet view.
**Pass:** All amounts update.

### U5: Clipboard Auto-Clear
**What:** Copied address clears after 60 seconds.
**Procedure:** Click address to copy, paste immediately (verify copied), wait 65 seconds, paste again.
**Pass:** Second paste is empty or different content.

---

## Pre-Mainnet Gate

All of the following must pass before using with real sats or real files:

- [ ] C1-C6: All catastrophic tests pass
- [ ] S1-S6: All security tests pass
- [ ] M1-M4: All moderate tests pass
- [ ] `npx tsc --noEmit` — zero type errors
- [ ] `npm audit` — no critical vulnerabilities
- [ ] Seed backup → full restore cycle verified personally
- [ ] Testnet full unlock flow completed end-to-end
