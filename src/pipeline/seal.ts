/**
 * SealForge — WORM Chain
 *
 * Every tool call, every finding, every phase transition sealed
 * to an HMAC-SHA256 append-only chain.
 * Ported from sealforge/src/ — the chain that cannot be tampered with.
 */

import { createHash, createHmac } from 'crypto'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const CHAIN_FILE = join(process.cwd(), 'cases', 'worm-chain.jsonl')
const HMAC_SECRET = process.env.SEAL_SECRET ?? 'agentscope-sift-sovereign-2026'

export interface ChainEntry {
  seq: number
  ts: string
  type: 'TOOL_CALL' | 'FINDING' | 'PHASE' | 'REPORT' | 'BLOCK'
  tool?: string
  phase?: string
  payload: Record<string, unknown>
  prev_seal: string
  seal: string
}

let _seq = 0
let _prevSeal = '0'.repeat(64)

export function initChain(): void {
  if (existsSync(CHAIN_FILE)) {
    const lines = readFileSync(CHAIN_FILE, 'utf-8').trim().split('\n').filter(Boolean)
    if (lines.length > 0) {
      const last = JSON.parse(lines[lines.length - 1]) as ChainEntry
      _seq = last.seq + 1
      _prevSeal = last.seal
    }
  }
}

export function sealEntry(
  type: ChainEntry['type'],
  payload: Record<string, unknown>,
  tool?: string,
  phase?: string,
): ChainEntry {
  const ts = new Date().toISOString()
  const content = JSON.stringify({ seq: _seq, ts, type, tool, phase, payload, prev_seal: _prevSeal })
  const seal = createHmac('sha256', HMAC_SECRET).update(content).digest('hex')

  const entry: ChainEntry = {
    seq: _seq++,
    ts,
    type,
    tool,
    phase,
    payload,
    prev_seal: _prevSeal,
    seal,
  }

  _prevSeal = seal
  writeFileSync(CHAIN_FILE, JSON.stringify(entry) + '\n', { flag: 'a' })
  return entry
}

export function verifyChain(): { valid: boolean; broken_at?: number } {
  if (!existsSync(CHAIN_FILE)) return { valid: true }
  const lines = readFileSync(CHAIN_FILE, 'utf-8').trim().split('\n').filter(Boolean)

  let prevSeal = '0'.repeat(64)
  for (const line of lines) {
    const entry = JSON.parse(line) as ChainEntry
    const content = JSON.stringify({
      seq: entry.seq, ts: entry.ts, type: entry.type,
      tool: entry.tool, phase: entry.phase,
      payload: entry.payload, prev_seal: entry.prev_seal
    })
    const expected = createHmac('sha256', HMAC_SECRET).update(content).digest('hex')
    if (expected !== entry.seal) return { valid: false, broken_at: entry.seq }
    prevSeal = entry.seal
  }

  return { valid: true }
}

export function hashFile(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}
