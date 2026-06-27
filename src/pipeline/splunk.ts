/**
 * Splunk HEC Integration
 *
 * Sends structured AGENTSCOPE telemetry to Splunk via HTTP Event Collector.
 * Every agent phase, BOB verdict, SENTINEL decision, and WORM seal becomes
 * a searchable, alertable event in Splunk.
 *
 * SOC analysts get:
 *   - Real-time investigation timelines
 *   - Alerts when SENTINEL blocks or quarantines
 *   - Council escalation triggers on low confidence
 *   - Full chain-of-custody audit in Splunk indexes
 */

// Splunk HEC uses HTTPS on 8088 with self-signed cert — disable TLS check for dev
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const HEC_URL   = process.env.SPLUNK_HEC_URL   ?? 'https://localhost:8088/services/collector/event'
const HEC_TOKEN = process.env.SPLUNK_HEC_TOKEN  ?? '2f957ebb-2bc6-4138-8ca9-9a91b8e4b820'
const INDEX     = process.env.SPLUNK_INDEX      ?? 'agentscope'
const ENABLED   = process.env.SPLUNK_DISABLED !== 'true'

export type SplunkEventType =
  | 'phase_transition'
  | 'tool_call'
  | 'bob_verdict'
  | 'sentinel_verdict'
  | 'worm_seal'
  | 'finding'
  | 'council_escalation'
  | 'agent_disagreement'
  | 'low_confidence'
  | 'investigation_complete'

export interface SplunkEvent {
  event_type:   SplunkEventType
  case_id?:     string
  phase?:       string
  tool?:        string
  verdict?:     string
  confidence?:  number
  trust_score?: number
  finding?:     string
  detail?:      string
  worm_seq?:    number
  seal?:        string
  agent?:       string
  [key: string]: unknown
}

let _caseId = `case-${Date.now().toString(36)}`

export function setCaseId(id: string) { _caseId = id }

async function send(payload: SplunkEvent): Promise<boolean> {
  if (!ENABLED) return false
  try {
    const body = JSON.stringify({
      time:       Date.now() / 1000,
      sourcetype: 'agentscope:sift',
      index:      INDEX,
      source:     'agentscope-sift-demo',
      event:      { case_id: _caseId, ...payload },
    })
    const resp = await fetch(HEC_URL, {
      method:  'POST',
      headers: { 'Authorization': `Splunk ${HEC_TOKEN}`, 'Content-Type': 'application/json' },
      body,
      signal:  AbortSignal.timeout(2000),
    })
    return resp.ok
  } catch {
    return false // Splunk offline — demo continues uninterrupted
  }
}

// ── Typed event senders ────────────────────────────────────────────────────────

export const splunk = {
  phase(phase: string, input?: string) {
    return send({ event_type: 'phase_transition', phase, detail: input })
  },

  toolCall(tool: string, phase: string, args?: Record<string, unknown>) {
    return send({ event_type: 'tool_call', tool, phase, ...args })
  },

  bob(tool: string, pass: boolean, detail?: string, entropy?: number) {
    return send({ event_type: 'bob_verdict', tool, verdict: pass ? 'PASS' : 'BLOCK', detail, entropy })
  },

  sentinel(tool: string, verdict: string, trust_score: number) {
    return send({ event_type: 'sentinel_verdict', tool, verdict, trust_score })
  },

  seal(tool: string, seq: number, seal: string, phase: string) {
    return send({ event_type: 'worm_seal', tool, worm_seq: seq, seal: seal.slice(0, 16) + '…', phase })
  },

  finding(detail: string, confidence: number, type: 'confirmed' | 'inferred' | 'unresolved', seq: number) {
    return send({ event_type: 'finding', finding: type, detail, confidence, worm_seq: seq })
  },

  // SOC alert — fires when confidence drops below threshold
  lowConfidence(tool: string, confidence: number, finding: string) {
    return send({
      event_type:  'low_confidence',
      tool,
      confidence,
      finding,
      detail: `Confidence ${confidence.toFixed(2)} below escalation threshold (0.75) — Council review required`,
      alert:  'COUNCIL_REVIEW_REQUIRED',
    })
  },

  // SOC alert — fires when BOB and SENTINEL disagree
  agentDisagreement(tool: string, bob_verdict: string, sentinel_verdict: string, resolution: string) {
    return send({
      event_type:       'agent_disagreement',
      tool,
      bob_verdict,
      sentinel_verdict,
      resolution,
      detail: `BOB: ${bob_verdict} | SENTINEL: ${sentinel_verdict} → ${resolution}`,
      alert:  'AGENT_DISAGREEMENT',
    })
  },

  // Council escalation — triggers SOC analyst review
  councilEscalation(reason: string, confidence: number, finding: string) {
    return send({
      event_type:  'council_escalation',
      reason,
      confidence,
      finding,
      detail:      `Council intervention required: ${reason}`,
      alert:       'COUNCIL_ESCALATION',
      priority:    confidence < 0.5 ? 'HIGH' : 'MEDIUM',
    })
  },

  complete(findings: number, blocked: number, chainValid: boolean, phases: string) {
    return send({
      event_type:   'investigation_complete',
      findings,
      blocked,
      chain_valid:  chainValid,
      phases,
    })
  },
}
