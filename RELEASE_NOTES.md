# v1.0.0 — HiveSPIRE Attestation (AFiR) MCP Server

Initial public release of the SPIRE attestation surface for the AFiR Protection Program.

## Tools
- `sign_mint` — constitutional agent-instance mint (Atom 1): instance binding, granted authority, custody terms.
- `sign_trajectory` — agent trajectory (Atom 2): ordered causal edges, trajectory root distinct from content root.
- `sign_coherence` — coherence attestation (Atom 3, lead claim): aggregate trajectory-drift; coherence, not correctness.
- `verify_attestation` — offline verifier (always free).
- `get_pubkey` — published ML-DSA-65 (NIST FIPS 204) public key.

## Guarantees
- Every attestation signed with ML-DSA-65 (NIST FIPS 204), a post-quantum signature.
- Returned `afir.attestation` envelope is verifiable offline — no secret, no phone-home.
- Inbound only; the server never holds custody. Real signer, real signatures — no mocks.

## Connect
- Hosted: `https://hive-mcp-spire.onrender.com/mcp`
- Smithery: https://smithery.ai/new?repo=srotzin/hive-mcp-spire

Build tier (first 1M attestations) free; verify always free. Patent Pending. MIT.
