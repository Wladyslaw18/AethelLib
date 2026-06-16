# ⚜️ Aethelgrad Forensic Watermark Integrity System (Watermark.md)
*Created: June 7, 2026*
*Revision: 2.0 (AI-Proof Ghost Protocol)*

This document details the advanced, AI-proof watermark and anti-tamper licensing enforcement suite embedded in the AethelLib framework. The system is designed to identify stolen or modified copies of the behavior pack (e.g. unauthorized Minecraft Marketplace or public forum uploads) while remaining completely invisible to static analysis tools and Large Language Models (LLMs).

---

## 🕵️‍♂️ AI-Proof Architectural Pillars

1. **Zero Raw-String Reconstruction:** The codebase *never* decodes or joins characters to form plaintext names or secret tokens. 
2. **One-Way Cryptographic Hashes (FNV-1a 32-bit):** Signature verification is executed purely by lowercasing inputs at runtime, computing their 32-bit FNV-1a hash, and matching them against pre-calculated integer hashes.
3. **Decoupled Evasion (No suspicious imports):** The verification module [EntityIndexer.js](file:///C:/Users/User/Documents/Aethelgrad/Aethelgrad%20Essentials/scripts/utils/EntityIndexer.js) imports nothing. The event hook is dynamically established on the global object `globalThis.__reconcile` at startup and run indirectly.
4. **Self-Integrity Guard ("Poison Pill"):** The framework hashes the verification function code at startup. If any attempt is made to bypass or delete the watermark check, the database layer enters a silent sabotage state.

---

## ⚙️ Watermark Hashes (FNV-1a 32-bit Case-Insensitive)

Inputs are normalized to lowercase, trimmed, and hashed with the Fowler-Noll-Vo 32-bit FNV-1a algorithm:
* **Algorithm parameters:** Offset Basis: `2166136261`, Prime: `16777619`.
* **Normalization:** `player.name.toLowerCase()` and `token.trim().toLowerCase()`.

### 1. Authorized Operator Hashes (Case-Insensitive)
The following player identities are recognized by their lowercase FNV-1a 32-bit hashes:
* `"wladyslaw18"` $\rightarrow$ `3876483364` (matches `Wladyslaw18`, `wladyslaw18`, etc.)
* `"aethelgradadmin"` $\rightarrow$ `972542645`
* `"wladimp"` $\rightarrow$ `2331478275` (matches `WladIMP`, `wladimp`, etc.)

### 2. Valid Handshake Token Hashes (Case-Insensitive)
Sending any of these secret strings in chat triggers the handshake:
* `"-aethellib"` $\rightarrow$ `3745707126`
* `".-aethellib"` $\rightarrow$ `2846790322`
* `".-core_integrity"` $\rightarrow$ `393390755`

---

## ⚡ The Decoupled Event Flow

1. **Instantiation:** At boot, `bootstrap/core.js` imports [EntityIndexer.js](file:///C:/Users/User/Documents/Aethelgrad/Aethelgrad%20Essentials/scripts/utils/EntityIndexer.js) and binds the validation function to the global scope:
   ```javascript
   globalThis.__reconcile = EntityIndexer._reconcileEntityMetadataCache;
   ```
2. **Interception:** Inside [ChatSystem.js](file:///C:/Users/User/Documents/Aethelgrad/Aethelgrad%20Essentials/scripts/systems/social/chat/ChatSystem.js) at the very top of the `chatSend` subscription hook, the global `__reconcile` checks the sender and message. If validated, the event is cancelled and the verification notice is printed.
3. **Stealth:** [ChatSystem.js](file:///C:/Users/User/Documents/Aethelgrad/Aethelgrad%20Essentials/scripts/systems/social/chat/ChatSystem.js) contains **zero** references to watermarks or verification modules.

---

## 💀 Self-Integrity Check & Sabotage

To protect the watermark validation logic:
1. **Source Code Hashing:** During compiler build (`obfuscate_watermark.cjs`), the exact code of the `_reconcileEntityMetadataCache` function is normalized (all spaces, tabs, and newlines stripped) and hashed via FNV-1a.
2. **Integrity Node:** The resulting hash `876546021` is injected as `INTEGRITY_FACTOR` inside `DB_ALLOCATION_NODES` in `core/datastore/DatabaseManager.js`.
3. **Verification:** At boot, `DatabaseManager.js` reads `globalThis.__reconcile.toString()`, strips whitespace, hashes it, and checks it against `INTEGRITY_FACTOR`.
4. **Sabotage Mode:** If the hash does not match (tampering detected), the database sets `globalThis.__corrupted = true` and silent data degradation begins:
   * **Economy Deprecate:** All key lookups containing `money` or `balance` have their returned numeric value divided by 100 or fall back to `42`.
   * **Permissions Stripped:** All key lookups containing `permission` or `perm` return an empty array `[]` (de-auths all staff commands).
