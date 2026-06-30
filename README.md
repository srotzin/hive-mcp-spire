# hive-mcp-spire — SPIRE Attestation (AFiR) MCP Server

> A record a party keeps about itself is not evidence; it is a claim. SPIRE issues an **independent, tamper-evident, offline-verifiable** attestation of what an AI agent actually did.

SPIRE is the attestation surface of the **AFiR Protection Program** from [Hive Civilization](https://www.thehiveryiq.com). Every attestation is signed with **ML-DSA-65 (NIST FIPS 204)** — a post-quantum signature — by the Hive typed signer, and is verifiable offline with the returned envelope. No secret is needed to verify; anyone can check an attestation against the published public key.

Patent Pending. MIT licensed. Build tier (first 1M attestations) free; **verify is always free.**

---

## Tools

| Tool | What it seals | Pass |
|---|---|---|
| `sign_mint` | Constitutional agent-instance mint (Atom 1) — instance binding, granted authority, custody terms. No-self-attest custody, decaying authority, non-transferable binding. | `mint`: `{instance_id, agent_ref, authority, granted_at, decay, custodian_ref}` |
| `sign_trajectory` | Agent trajectory (Atom 2) — ordered causal edges, with a trajectory root distinct from the content root. Proves the path the agent took, not just its outputs. | `trajectory`: `{run_id, agent_ref, edges:[{from, to, seq, cause}]}` |
| `sign_coherence` | Coherence attestation (Atom 3, lead claim) — aggregate trajectory-drift. Attests coherence (stayed within mandate), not correctness; supports verifier-side correctness-refusal. | `coherence`: `{run_id, agent_ref, drift_score, window, mandate_ref}` |
| `verify_attestation` | Verify any signed SPIRE attestation offline. Returns `{valid, reasons[], scheme, ...}`. **Always free.** | `attestation`: the full object returned by any sign tool (carries `envelope` + `fragments_canon`) |
| `get_pubkey` | The ML-DSA-65 (FIPS 204) public key + issuer DID + spec, for offline verification. **Free.** | — |

Each sign tool returns a signed `afir.attestation` object (the ML-DSA-65 `envelope` plus its canonical `fragments_canon`). Hand that whole object to `verify_attestation` (or to any offline ML-DSA-65 verifier with the published key) to independently confirm it.

---

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness |
| `GET` | `/` | Service descriptor + atom map |
| `POST` | `/mcp` | MCP JSON-RPC 2.0 (initialize, tools/list, tools/call, ping) |
| `GET` | `/.well-known/mcp.json` | MCP discovery manifest |
| `GET` | `/.well-known/agent.json` | A2A agent card |

**Transport:** Streamable-HTTP. **Protocol:** MCP `2024-11-05`. **Inbound only** — the server never holds custody; it relays typed fragments to the Hive signer and returns the signed envelope.

Upstream signer: `https://hive-typed-signer.onrender.com` (override with `HIVE_SIGNER_URL`).

---

## Connect

**Hosted (recommended):** point your MCP client at

```
https://hive-mcp-spire.onrender.com/mcp
```

**Smithery:** [smithery.ai/new?repo=srotzin/hive-mcp-spire](https://smithery.ai/new?repo=srotzin/hive-mcp-spire)

**Local:**

```bash
git clone https://github.com/srotzin/hive-mcp-spire.git
cd hive-mcp-spire
npm install
node server.js     # listens on :3000
```

Quick check:

```bash
curl -s http://localhost:3000/health
curl -s -X POST http://localhost:3000/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## Environment

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Listen port |
| `ENABLE` | `true` | Set `false` for a dormant health-only instance |
| `HIVE_SIGNER_URL` | `https://hive-typed-signer.onrender.com` | Upstream typed signer |

---

## Why this exists

Self-reported logs are a claim. When an AI agent acts — mints an instance, takes a path, stays within a mandate — the counterparty needs proof that does not depend on trusting the actor's own records. SPIRE binds the exact state into a post-quantum signature that anyone can verify offline, forever, without phoning home.

Part of the Hive Civilization agent economy. © 2026 Steve Rotzin / Hive Civilization. MIT.
