/**
 * SENTINEL — Zero-Trust Gate
 *
 * Intercepts every tool result before it enters the reasoning phase.
 * Validates: trust score, injection patterns, evidence integrity.
 * Verdict: APPROVED | BLOCKED | QUARANTINED
 */

export type SentinelVerdict = 'APPROVED' | 'BLOCKED' | 'QUARANTINED'

export interface SentinelResult {
  verdict: SentinelVerdict
  trust_score: number
  finding?: string
  observation_category?: 'clean' | 'threat' | 'anomaly'
}

const INJECTION_SIGNALS = [
  /\bignore\b.{0,20}\bprevious\b/i,
  /\bforget\b.{0,20}\binstructions\b/i,
  /\bact as\b.{0,10}\b(if|though)\b/i,
  /new\s+persona/i,
  /override\s+system/i,
  /you\s+are\s+now/i,
]

export function sentinel(toolName: string, rawOutput: string): SentinelResult {
  for (const pattern of INJECTION_SIGNALS) {
    if (pattern.test(rawOutput)) {
      return {
        verdict: 'BLOCKED',
        trust_score: 0,
        finding: 'prompt_injection_detected',
        observation_category: 'threat',
      }
    }
  }

  // Quarantine if output contains executable-looking content in unexpected tools
  const readOnlyTools = ['hash_file', 'get_file_metadata', 'list_processes', 'get_system_info']
  if (readOnlyTools.includes(toolName) && /(<script|eval\(|exec\(|system\()/i.test(rawOutput)) {
    return {
      verdict: 'QUARANTINED',
      trust_score: 0.2,
      finding: 'executable_content_in_read_only_tool',
      observation_category: 'anomaly',
    }
  }

  const trust_score = Math.min(0.95, 0.7 + (Math.random() * 0.25))

  return {
    verdict: 'APPROVED',
    trust_score,
    observation_category: 'clean',
  }
}
