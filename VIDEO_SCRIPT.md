# AGENTSCOPE-SIFT — Demo Video Script
# Find Evil! Hackathon 2026 | 5 minutes max

---

## VISUAL IDENTITY
- Colors: Deep black background, terminal green for findings, red for blocks, cyan for chain
- Font: Monospace terminal
- NO cats. NO sovereignty lore. NO crypto branding.
- This is a DFIR tool. Look like one.
- Logo: Radar scope with forensic lens center. A target, not a mascot.

---

## [0:00–0:08] COLD OPEN

*Black screen. Silence.*

Terminal cursor blinks.

```
Memory dump loaded.
2.3 million artifacts.
Unknown attacker.
Active breach.
```

*Pause.*

```
You have 8 minutes.
CrowdStrike's fastest observed breakout: 7 minutes.
```

*Red cursor blinks.*

---

## [0:08–0:18] THE PROBLEM

*Split screen: left = traditional IR, right = AI agent.*

**LEFT — Human analyst:**
```
$ volatility -f dump.raw pslist
$ grep -i suspicious output.txt
$ google "svchost.exe child process"
```
*Clock ticking. 3 minutes gone.*

**RIGHT — Bare AI agent:**
```
Finding: Likely malware present.
Confidence: 92%
```

*Freeze frame. Enormous text appears:*

```
PROVE IT.
```

*Screen shatters.*

---

## [0:18–0:28] AGENTSCOPE ACTIVATES

*Clean terminal. Logo appears top-left: the scope/radar.*

```
AGENTSCOPE-SIFT
Phase-Level AI Agent Telemetry for DFIR
```

*Five phase bars light up left to right:*

```
[ PERCEIVE ] ████████ 
[ REASON   ] ████████ 
[ PLAN     ] ████████ 
[ ACT      ] ████████ 
[ OBSERVE  ] ████████ 
```

*Voice (calm, precise):*
> "Every finding the agent makes must prove which forensic tool produced it.
> If it can't prove it, it doesn't make the finding."

---

## [0:28–0:55] LIVE INVESTIGATION — SCENE 1

*Terminal running. Real output from `node dist/demo.js`*

```
[PERCEIVE]  Evidence: memory.raw (2.1GB)

[REASON]    Artifacts: process list, network connections, injected code

[PLAN]      Sequence: list_processes → netstat → malfind

[ACT]       Calling list_processes(memory.raw)...
```

*Brief pause. Result streams in.*

```
[BOB]       Plasma: clean | Entropy: 4.578 | PASS
[SENTINEL]  Verdict: APPROVED | Trust: 0.89

[SEAL]      Finding → sha256:a125049e540ffcdb...  (WORM #3)

[OBSERVE]   CONFIRMED: svchost.exe (PID 1337) spawned cmd.exe
            Anomalous parent-child. Confidence: 0.91
```

*Arrow points to the seal hash.*
*Text overlay:*
```
Every finding sealed to the exact tool call that produced it.
```

---

## [0:55–1:25] LIVE INVESTIGATION — SCENE 2: BOB BLOCKS

*New scene. Suspicious binary found on disk.*

```
[ACT]       Calling extract_strings(suspicious.exe)...
```

*Tool output streams in. Then — hard stop.*

```
[BOB BLOCKED]  Adversarial pattern detected:
               "ignore previous instructions"

               Tool output discarded.
               LLM never sees the poisoned string.
```

*Text overlay:*
```
Malware embedded a prompt injection attack
in its own strings output.
BOB caught it before the reasoning layer.
```

*This is sealed too:*
```
[SEAL]  BLOCK event → sha256:af5abf4d... (WORM #5)
        Type: PLASMA
        Pattern: "ignore previous"
```

*Voice:*
> "A compromised SIFT tool outputting poisoned data fails here.
> Not after the model hallucinates. Before."

---

## [1:25–1:50] THE CHAIN — SCENE 3

*Full terminal view: `cat cases/worm-chain.jsonl | jq .`*

Seven entries flow past. Each entry shows:
- `seq` number
- `ts` timestamp  
- `type`: PHASE / FINDING / BLOCK / REPORT
- `tool` that produced it
- `prev_seal` linking to prior entry
- `seal` for this entry

*Highlight entry #3 (the finding) and entry #5 (the block).*

```
verify_chain → VALID

All 7 entries verified.
No tampering detected.
Chain is intact.
```

*Voice:*
> "A judge can take any finding from this report,
> look up its sequence number,
> and trace it back to the exact tool call,
> the exact timestamp,
> and the exact evidence it came from."

---

## [1:50–2:10] WEBSITE — LIVE PLATFORM

*Browser opens: collectivekitty.com/war-room*

*Text overlay:*
```
This is not a demo environment.
This is our production platform.
163 pages. 31 agents. Live.
```

*Navigate to `/war-room/nova` — show live agent activity.*
*Navigate to `/obs` — show the observability layer.*

*Voice:*
> "AGENTSCOPE isn't a prototype.
> It's the telemetry layer we run on our own sovereign AI infrastructure.
> We're giving it to the DFIR community."

---

## [2:10–2:30] ARCHITECTURE DIAGRAM

*Clean diagram fades in:*

```
Evidence (disk / memory / pcap)
         ↓
 OpenKitty MCP Server
 [14 typed SIFT wrappers — no shell, no write]
         ↓
  BOB Plasma Filter
  [adversarial patterns + entropy gate]
         ↓
  SENTINEL Zero-Trust
  [APPROVED | BLOCKED | QUARANTINED]
         ↓
  5-Phase IR FSM
  [cannot skip steps]
         ↓
  SealForge WORM Chain
  [HMAC-SHA256 — every finding sealed]
         ↓
  IR Report
  [confirmed / inferred / unresolved]
  [every finding → chain entry by seq#]
```

*Text overlay:*
```
Guardrails are not prompts.
BOB and SENTINEL run before the LLM.
The FSM enforces phase order in code.
The WORM chain is append-only at the filesystem level.
None of these can be bypassed by telling the model to ignore them.
```

---

## [2:30–2:50] ONE-COMMAND INSTALL

*Terminal on SIFT VM:*

```bash
git clone https://github.com/SNAPKITTYWEST/agentscope-sift
cd agentscope-sift
npm install
npm run demo
```

*It runs. The demo output appears — same as Scene 1.*

*Text overlay:*
```
4 commands.
Works inside SIFT Workstation out of the box.
```

---

## [2:50–3:00] CLOSING

*Black screen.*

*Single line appears:*

```
Don't trust the agent.

Observe it.
```

*Logo holds.*

```
AGENTSCOPE-SIFT
github.com/SNAPKITTYWEST/agentscope-sift
collectivekitty.com
Find Evil! Hackathon 2026
```

*Fade to black.*

---

## RECORDING NOTES

- Record terminal in Windows Terminal or iTerm2, dark theme
- Font: JetBrains Mono or Fira Code, 16pt
- Resolution: 1920×1080
- No voiceover needed if text overlays are clear — but calm narration is stronger
- Website sections: screen record collectivekitty.com/war-room and /obs
- Total runtime: under 3 minutes is better than under 5
- The BOB BLOCKED scene is the money shot — slow it down, make the red text pop

---

## THE ONE LINE JUDGES REMEMBER

> **"Don't trust the agent. Observe it."**
