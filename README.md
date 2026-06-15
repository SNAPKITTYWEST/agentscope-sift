# AGENTSCOPE-SIFT

> **"SIFT gives investigators tools. AGENTSCOPE gives the AI an evidence trail."**
>
> We do not let the agent claim a finding unless it can prove which forensic tool produced it.

[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Node: 18+](https://img.shields.io/badge/node-18+-blue?style=flat-square)]()
[![MCP](https://img.shields.io/badge/protocol-MCP-purple?style=flat-square)]()
[![Chain: WORM](https://img.shields.io/badge/chain-WORM--sealed-brightgreen?style=flat-square)]()

**Find Evil! Hackathon 2026 — SANS SIFT Workstation + Protocol SIFT**

---

## The Problem

Protocol SIFT connects AI agents to 200+ forensic tools. The problem is trust: when the agent says "I found malware," can you prove *which tool* produced that finding? Can you prove the output wasn't tampered with? Can you prove a compromised binary didn't embed a poison payload in its own strings output to fool the analysis?

AGENTSCOPE answers all three. Cryptographically.

---

## What It Does

AGENTSCOPE wraps Protocol SIFT's tool layer with three architectural guarantees before the LLM reasons on any evidence:

**1. BOB Plasma Filter** — Every tool output is treated as raw plasma until proven clean. Non-recursive adversarial pattern matching + Shannon entropy gate. A malware sample that embeds "ignore previous instructions" in its strings output is blocked before the LLM sees it.

**2. SENTINEL Zero-Trust Gate** — Validates trust score and injection signals on every tool result. Returns APPROVED / BLOCKED / QUARANTINED. Verdict is a first-class field in every chain entry.

**3. SealForge WORM Chain** — Every tool call, every finding, every block event is sealed to an HMAC-SHA256 append-only chain. Every finding links to the exact tool call (by sequence number) that produced it. Run `verify_chain` and the chain either holds or it tells you exactly where it broke.

**The 5-Phase IR Loop** — The agent cannot skip steps. perceive → reason → plan → act → observe. Phase transitions are validated by the FSM. The agent cannot jump from "I see a suspicious process" to "confirmed malware" without running the correlation phase.

---

## Quickstart (on SIFT Workstation)

```bash
# 1. Boot SIFT Workstation VM
# 2. Install Protocol SIFT
curl -fsSL https://raw.githubusercontent.com/teamdfir/protocol-sift/main/install.sh | bash

# 3. Clone AGENTSCOPE-SIFT
git clone https://github.com/SNAPKITTYWEST/agentscope-sift
cd agentscope-sift
npm install

# 4. Run the demo (no evidence files needed — uses simulated data)
npm run build && npm run demo

# 5. Inspect the sealed evidence chain
cat cases/worm-chain.jsonl | python3 -m json.tool
```

---

## Wire into Protocol SIFT

Add to your Protocol SIFT MCP config:

```json
{
  "mcpServers": {
    "agentscope-sift": {
      "command": "node",
      "args": ["/path/to/agentscope-sift/dist/server.js"]
    }
  }
}
```

The agent now has 14 typed forensic tools instead of raw shell. It physically cannot run `rm`, `dd`, `chmod`, or any destructive command — those tools are not exposed.

---

## Architecture

```
Evidence (disk image / memory dump / pcap / logs)
                    ↓
    OpenKitty MCP Server — typed SIFT tool wrappers
    [list_processes, find_injected_code, scan_with_yara, ...]
    No shell passthrough. No write commands.
                    ↓
         BOB Plasma Filter
    Adversarial pattern matching + entropy gate
    Blocks poisoned tool output before LLM sees it
                    ↓
        SENTINEL Zero-Trust Gate
    Trust scoring + injection signal detection
    Verdict: APPROVED | BLOCKED | QUARANTINED
                    ↓
    5-Phase IR FSM — cannot skip steps
    perceive → reason → plan → act → observe
                    ↓
       SealForge WORM Chain (HMAC-SHA256)
    Every finding sealed to its tool call
    append-only, tamper-evident, exportable
                    ↓
           IR Report
    confirmed / inferred / unresolved
    Every finding links to chain entry by seq#
```

**Architectural boundary:** Guardrails are not prompts. BOB and SENTINEL run before the LLM. The FSM enforces phase order in code. The WORM chain is append-only at the filesystem level. None of these can be bypassed by telling the model to ignore them.

---

## Judging Criteria Coverage

| Criterion | How AGENTSCOPE addresses it |
|---|---|
| Autonomous Execution Quality | 5-phase FSM, self-correction on BLOCKED findings, max_iterations cap prevents runaway |
| IR Accuracy | Typed tool wrappers prevent raw-shell hallucination; findings labeled confirmed/inferred/unresolved |
| Constraint Implementation | BOB + SENTINEL are architectural, not prompt-based. Tested with simulated adversarial payloads |
| Audit Trail Quality | Every finding sealed to exact tool call (seq#). `verify_chain` proves integrity |
| Breadth and Depth | Memory forensics, disk analysis, timeline, malware scanning, network capture, file metadata |
| Usability | `npm install && npm run demo` inside SIFT VM |

---

## Evidence Chain Format

Every entry in `cases/worm-chain.jsonl`:

```json
{
  "seq": 4,
  "ts": "2026-06-15T14:23:11.042Z",
  "type": "FINDING",
  "tool": "list_processes",
  "phase": "act",
  "payload": {
    "finding": "suspicious_process_hierarchy",
    "detail": "svchost.exe (PID 1337) spawned cmd.exe — anomalous parent-child",
    "trust_score": 0.89
  },
  "prev_seal": "a3f9b2...",
  "seal": "7c4d1e..."
}
```

Any finding can be verified: `seq` links to the tool call entry, `prev_seal` links to the prior entry, `seal` = HMAC-SHA256 of the full entry content.

---

## Built On

- **SnapKitty Sovereign OS** — 20+ repos, 31 agents, 5-phase agentic loop, WORM chain, BOB runtime
- **SealForge** — Cryptographically sealed AI decision ledger (HMAC-SHA256 WORM chain)
- **Protocol SIFT** — MCP framework for SANS SIFT Workstation
- **BOB** — Sovereign Alien Trust Demigod Runtime — plasma filter + quantum coherence gate

**Stack:** TypeScript, Node.js 18+, MCP SDK, SIFT Workstation tools (volatility3, sleuthkit, yara, tshark, log2timeline)

---

## License

MIT — open source, community tool.

*Built for Find Evil! Hackathon 2026 by Ahmad Parr / SnapKitty*
