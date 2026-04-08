# Bitcoin Vault — Mainnet Testing Log

*April 8, 2026 — First live mainnet test session*

## Test Environment
- MacBook Air M4 (2025), macOS Sequoia
- Bitcoin Vault V2, running via `npm start` (Electron dev mode)
- Mainnet (not testnet)
- Sending wallet: mobile app

## Session Timeline

### 1. Vault Creation
- Created new vault with 12-word seed
- Initial unlock cost set to 750 sats
- Password set, vault folder configured

### 2. First Unlock Attempt — 750 Sat Problem
- **Discovery:** Most mobile wallets cannot send below ~1,500 sats due to dust limits and minimum send amounts
- Lock screen showed QR with 750 sat requirement
- Could not send from phone wallet
- **Fix applied:** Minimum raised to 1,500 sats globally. Auto-upgrade on login for existing vaults below 1,500.

### 3. First Successful Unlock
- Sent 1,677 sats from mobile wallet
- BIP21 URI specified `amount=0.000015` (1,500 sats)
- Wallet honored the BIP21 amount: sent exactly 1,500 to vault address
- Remaining 177 sats consumed as on-chain fee
- Transaction detected within seconds (mempool.space polling)
- "Transaction detected. Waiting for confirmation..." displayed in orange
- Block confirmed, vault unlocked automatically
- Balance showed 1,500 sats, 1 UTXO

### 4. Amount Matching Change
- Original spec required exact match (==)
- **Changed to >= (at least required amount)**
- Rationale: users overpaying slightly due to wallet rounding should not be rejected
- Underpayment still rejected

### 5. Auto-Lock Timer During Payment Wait
- **Discovery:** Blocks can take 10+ minutes to confirm
- Auto-lock timer could expire during confirmation wait, forcing user to restart
- **Fix applied:** `touchActivity()` called on every poll cycle during payment screen

### 6. File Import Test
- Imported `bitcoin-vault-icon.png` (20.1 KB) successfully
- File appeared in vault browser with name, size, date
- Set per-file protection: 1,500 sats/per session

### 7. Second Unlock
- Sent another 1,677 sats
- Same flow: detected → confirmed → unlocked
- Balance now 3,000 sats (2 UTXOs of 1,500 each)

### 8. Protection Model Discovery
- **Problem:** Protection could be set AND removed with zero proof of work while vault was open
- Anyone with vault access could strip protection and access files freely
- **Fix applied:** Protection is now permanent once set. Cannot be removed.
- Double-clicking a protected file shows "Protected File" dialog with required cost

### 9. Deletion Cost Feature
- Added `deletionCostSats` — permanent once set, requires payment to delete
- Prevents someone with vault access from destroying protected files

## Fee Data (Mainnet, April 8 2026)
- Fee rate: 1 sat/vB (all tiers — low congestion day)
- Unlock tx fee: ~110 sats estimated
- Send tx fee: ~209 sats estimated
- Actual fee paid by sender: 177 sats

## Wallet State After Testing
- Balance: 3,000 sats (2 x 1,500)
- UTXOs: 2
- Files: 1 (bitcoin-vault-icon.png, protected at 1,500 sats/session)

## Issues Found & Fixed During Testing
1. 750 sat minimum too low for real wallets → raised to 1,500
2. Exact amount matching rejected overpayments → changed to >=
3. Auto-lock timer expired during block wait → keep alive during polling
4. Protection removable without PoW → made permanent
5. No deletion protection → added permanent deletion cost
6. Unlock cost not editable after setup → added Settings dropdown

## Lessons
- Real-world testing reveals issues that audits don't catch
- BIP21 URI amount is respected by mobile wallets (good UX)
- 1 sat/vB fee environment means unlock costs ~110 sats in fees
- mempool.space detection is fast (seconds), confirmation depends on blocks
