# v1.0.1 — Anthropic MCP Directory readiness

Tool metadata hardening for directory listing and client UX. No behavior change to signing or verification.

- Added `title` to all five tools (Sign Instance Mint, Sign Trajectory, Sign Coherence, Verify Attestation, Get Public Key).
- Added MCP `annotations` to every tool: `title`, `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`.
  - `sign_mint`, `sign_trajectory`, `sign_coherence` — `readOnlyHint: false` (they mint a new signed attestation upstream), `destructiveHint: false`.
  - `verify_attestation`, `get_pubkey` — `readOnlyHint: true`, `idempotentHint: true`.
- Unauthenticated, public, inbound-only HTTPS MCP server. ML-DSA-65 (NIST FIPS 204) signing via the Hive typed signer; envelopes verifiable offline.

Build tier (first 1M attestations) free. Patent Pending. Hive Civilization.
