#!/usr/bin/env node
/**
 * hive-mcp-spire — SPIRE Attestation (AFiR) MCP Server
 *
 * Three signing tools — sign_mint, sign_trajectory, sign_coherence — plus an
 * offline verifier and the published public key. Every attestation is signed
 * with ML-DSA-65 (NIST FIPS 204) by the Hive typed signer and is verifiable
 * offline with the returned envelope. A record a party keeps about itself is
 * not evidence; it is a claim. SPIRE issues an independent, tamper-evident,
 * offline-verifiable attestation of what an AI agent actually did.
 * Patent Pending. Hive Civilization.
 *
 * Streamable-HTTP, JSON-RPC 2.0, MCP 2024-11-05. Inbound only.
 * Build tier (first 1M attestations) free. MIT.
 */
import express from 'express';

const SERVICE     = 'hive-mcp-spire';
const VERSION     = '1.0.0';
const PORT        = process.env.PORT || 3000;
const ENABLE      = (process.env.ENABLE ?? 'true') !== 'false';
const BRAND_BLUE  = '#22D3EE';
const SIGNER_BASE = process.env.HIVE_SIGNER_URL || 'https://hive-typed-signer.onrender.com';
const SIGN_PATH   = '/sign';
const VERIFY_PATH = '/verify';
const PUBKEY_URL  = `${SIGNER_BASE}/pubkey`;

// SPIRE atoms — each maps to a typed fragment set sent to the signer.
const ATOMS = {
  mint:       { label: 'SPIRE Mint',       docket: 'HC-2026-ATOM1', frag: 'spire.mint' },
  trajectory: { label: 'SPIRE Trajectory', docket: 'HC-2026-ATOM2', frag: 'spire.trajectory' },
  coherence:  { label: 'SPIRE Coherence',  docket: 'HC-2026-ATOM3', frag: 'spire.coherence' },
};

// ─── Tools ──────────────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'sign_mint',
    description: 'Sign a constitutional agent-instance mint (SPIRE Atom 1). Seals the agent instance binding, its granted authority, and custody terms into one ML-DSA-65 (FIPS 204) attestation envelope — with no-self-attest custody, decaying authority, and non-transferable instance binding. Returns the signed envelope, verifiable offline. Pass a "mint" object: {instance_id, agent_ref, authority, granted_at, decay, custodian_ref}. Build tier (first 1M attestations) free.',
    inputSchema: {
      type: 'object',
      properties: {
        mint: {
          type: 'object',
          description: 'The instance mint to seal: {instance_id, agent_ref, authority, granted_at, decay, custodian_ref}.',
        },
      },
      required: ['mint'],
    },
  },
  {
    name: 'sign_trajectory',
    description: 'Sign an agent trajectory (SPIRE Atom 2). Seals the ordered causal edges of an agent run into one ML-DSA-65 (FIPS 204) attestation envelope, with a trajectory root kept distinct from the content root, so the exact path the agent took — not just its outputs — is provable after the fact. Returns the signed envelope, verifiable offline. Pass a "trajectory" object: {run_id, agent_ref, edges:[{from, to, seq, cause}]}. Build tier free.',
    inputSchema: {
      type: 'object',
      properties: {
        trajectory: {
          type: 'object',
          description: 'The trajectory to seal: {run_id, agent_ref, edges:[{from, to, seq, cause}]}.',
        },
      },
      required: ['trajectory'],
    },
  },
  {
    name: 'sign_coherence',
    description: 'Sign a coherence attestation (SPIRE Atom 3, the lead claim). Seals an aggregate trajectory-drift measure into one ML-DSA-65 (FIPS 204) attestation envelope. Attests coherence (the agent stayed within its mandate), not correctness — and supports verifier-side correctness-refusal. Returns the signed envelope, verifiable offline. Pass a "coherence" object: {run_id, agent_ref, drift_score, window, mandate_ref}. Build tier free.',
    inputSchema: {
      type: 'object',
      properties: {
        coherence: {
          type: 'object',
          description: 'The coherence measure to seal: {run_id, agent_ref, drift_score, window, mandate_ref}.',
        },
      },
      required: ['coherence'],
    },
  },
  {
    name: 'verify_attestation',
    description: 'Verify a signed SPIRE attestation offline (always free). Pass the full "attestation" object returned by any sign tool (it carries both the signed envelope and its canonical fragments). Returns {valid, reasons[], scheme, ...}. No secret required — anyone can verify with the published ML-DSA-65 public key. A record a party keeps about itself is a claim; this is the independent proof.',
    inputSchema: {
      type: 'object',
      properties: {
        attestation: { type: 'object', description: 'The full object returned by any sign tool: {envelope, fragments_canon, ...}.' },
      },
      required: ['attestation'],
    },
  },
  {
    name: 'get_pubkey',
    description: 'Get the Hive typed-signer public key and algorithm metadata for offline verification (free). Returns the ML-DSA-65 (NIST FIPS 204) public key, issuer DID, and spec.',
    inputSchema: { type: 'object', properties: {} },
  },
];

async function callSigner(path, body) {
  const r = await fetch(`${SIGNER_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!r.ok) throw new Error(`signer ${path} -> ${r.status}: ${typeof data === 'object' ? JSON.stringify(data) : text}`);
  return data;
}

async function executeTool(name, args) {
  if (name === 'sign_mint') {
    if (!args.mint || typeof args.mint !== 'object') throw new Error('Provide a "mint" object.');
    const data = await callSigner(SIGN_PATH, { fragments: [{ type: ATOMS.mint.frag, value: args.mint }] });
    return { type: 'text', text: JSON.stringify(data, null, 2) };
  }
  if (name === 'sign_trajectory') {
    if (!args.trajectory || typeof args.trajectory !== 'object') throw new Error('Provide a "trajectory" object.');
    const data = await callSigner(SIGN_PATH, { fragments: [{ type: ATOMS.trajectory.frag, value: args.trajectory }] });
    return { type: 'text', text: JSON.stringify(data, null, 2) };
  }
  if (name === 'sign_coherence') {
    if (!args.coherence || typeof args.coherence !== 'object') throw new Error('Provide a "coherence" object.');
    const data = await callSigner(SIGN_PATH, { fragments: [{ type: ATOMS.coherence.frag, value: args.coherence }] });
    return { type: 'text', text: JSON.stringify(data, null, 2) };
  }
  if (name === 'verify_attestation') {
    const att = args.attestation;
    if (!att || typeof att !== 'object' || !att.envelope) throw new Error('Provide the full "attestation" object returned by a sign tool (must contain envelope + fragments_canon).');
    const fragments = att.fragments_canon ?? att.envelope.fragments;
    const data = await callSigner(VERIFY_PATH, { envelope: att.envelope, fragments });
    return { type: 'text', text: JSON.stringify(data, null, 2) };
  }
  if (name === 'get_pubkey') {
    const r = await fetch(PUBKEY_URL, { signal: AbortSignal.timeout(15_000) });
    const data = await r.json();
    return { type: 'text', text: JSON.stringify(data, null, 2) };
  }
  throw new Error(`Unknown tool: ${name}`);
}

// ─── HTTP / MCP ───────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '8mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: SERVICE, version: VERSION, enabled: ENABLE }));

app.get('/', (_req, res) => res.json({
  service: SERVICE,
  version: VERSION,
  description: 'SPIRE Attestation (AFiR) MCP server. Sign agent-instance mints, trajectories, and coherence with ML-DSA-65 (FIPS 204). A record a party keeps about itself is a claim; SPIRE is the independent proof. Patent Pending. Hive Civilization.',
  endpoints: { mcp: '/mcp', well_known: '/.well-known/mcp.json', health: '/health' },
  upstream: SIGNER_BASE,
  atoms: Object.fromEntries(Object.entries(ATOMS).map(([k, v]) => [k, { label: v.label, docket: v.docket, fragment: v.frag }])),
  brand_color: BRAND_BLUE,
}));

app.post('/mcp', async (req, res) => {
  const { jsonrpc, id, method, params } = req.body || {};
  if (jsonrpc !== '2.0') {
    return res.status(400).json({ jsonrpc: '2.0', id: id ?? null, error: { code: -32600, message: 'Invalid Request' } });
  }
  try {
    switch (method) {
      case 'initialize':
        return res.json({
          jsonrpc: '2.0', id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: SERVICE, version: VERSION, description: 'SPIRE Attestation (AFiR). ML-DSA-65 signed, verifiable offline. Patent Pending. Hive Civilization.' },
          },
        });
      case 'tools/list':
        return res.json({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
      case 'tools/call': {
        const { name, arguments: args } = params || {};
        if (!ENABLE) return res.json({ jsonrpc: '2.0', id, error: { code: 503, message: 'service_disabled' } });
        try {
          const out = await executeTool(name, args || {});
          return res.json({ jsonrpc: '2.0', id, result: { content: [out] } });
        } catch (err) {
          return res.json({ jsonrpc: '2.0', id, error: { code: -32000, message: err.message } });
        }
      }
      case 'ping':
        return res.json({ jsonrpc: '2.0', id, result: {} });
      default:
        return res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  } catch (err) {
    return res.json({ jsonrpc: '2.0', id: id ?? null, error: { code: -32000, message: err.message } });
  }
});

app.get('/.well-known/mcp.json', (_req, res) => res.json({
  name: SERVICE,
  version: VERSION,
  protocol: '2024-11-05',
  transport: 'streamable-http',
  endpoint: '/mcp',
  description: 'SPIRE Attestation (AFiR). Sign agent-instance mints, trajectories, and coherence with ML-DSA-65 (FIPS 204). Verifiable offline. Patent Pending. Hive Civilization.',
  tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
  brand_color: BRAND_BLUE,
}));

app.get('/.well-known/agent.json', (_req, res) => res.json({
  name: SERVICE,
  description: 'SPIRE Attestation (AFiR) surface for the Hive agent economy. Every attestation ML-DSA-65 signed (FIPS 204) and verifiable offline.',
  url: `https://${SERVICE}.onrender.com`,
  provider: { organization: 'Hive Civilization', url: 'https://www.thehiveryiq.com', contact: 'steve@thehiveryiq.com' },
  capabilities: ['signed-attestations', 'instance-mint', 'trajectory-sealing', 'coherence-attestation', 'provenance'],
  tools: TOOLS.map(t => t.name),
  brand_color: BRAND_BLUE,
}));

if (!ENABLE) console.log(`[${SERVICE}] ENABLE=false — dormant (health only)`);

app.listen(PORT, () => console.log(`[${SERVICE}] v${VERSION} listening on :${PORT} -> ${SIGNER_BASE}`));
