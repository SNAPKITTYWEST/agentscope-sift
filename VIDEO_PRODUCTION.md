# AGENTSCOPE-SIFT — Full Production Video Script
# Find Evil! Hackathon 2026
# Target runtime: 4:00–4:30

---

## PRODUCTION NOTES
- Record each scene separately, then edit together
- Terminal: Windows Terminal or Ubuntu terminal in SIFT VM, dark theme, JetBrains Mono 16pt
- Browser: Chrome, no extensions visible, clean profile
- Resolution: 1920×1080
- No webcam. No face. Just screen.
- Narration goes on TOP of all scenes as a single voiceover track recorded last
- Music: none, or very low ambient (dark electronic, no beats)

---

# SCENE 1 — THE HOOK
# Duration: 0:00–0:12

**Screen:** Pure black

**What appears** (one line at a time, 1.5s gap):

```
An AI-powered attacker reaches full domain control
in under 8 minutes.

The defender is still pulling up their toolkit.

That gap is the problem.
```

**Then:**

```
AGENTSCOPE-SIFT

"We do not let the agent claim a finding
 unless it can prove which forensic tool produced it."
```

**Fade to black.**

---

# SCENE 2 — SIFT DOWNLOADING + BOOT
# Duration: 0:12–0:45

**What to record:**

**Step 1** — Browser open at sans.org/tools/sift-workstation
Show the download page. Click the download button.
Progress bar visible — even just a few seconds of it.

**Step 2** — VirtualBox (or VMware) import screen
Show the OVA file being imported. Progress bar.

**Step 3** — VM boots
Ubuntu loading screen. SIFT logo appears.

**Step 4** — Login screen
```
Username: sansforensics
Password: forensics
```
Type it slowly so judges can see.

**Step 5** — Desktop loads
SIFT Ubuntu desktop. Show it for 2 seconds.

**Cut immediately to Scene 3.**

---

# SCENE 3 — SIFT TERMINAL: INSTALL + RUN
# Duration: 0:45–1:30

**Open terminal in SIFT VM.**

Type each command — do NOT paste, type it so judges can follow.
Wait for each to complete before the next.

```bash
# Install Protocol SIFT
curl -fsSL https://raw.githubusercontent.com/teamdfir/protocol-sift/main/install.sh | bash
```

*Wait for install to complete. Show the output scrolling.*

```bash
# Clone AGENTSCOPE-SIFT
git clone https://github.com/SNAPKITTYWEST/agentscope-sift
```

```bash
cd agentscope-sift
npm install
```

```bash
# Cold boot the agent
node dist/demo.js
```

*Demo runs. Let it play fully. Do NOT cut the output.*

**Key moments to let linger (slow down editing here):**

```
[BOB BLOCKED]  Adversarial pattern detected: "ignore previous"
               Tool output discarded.
               LLM never sees the poisoned string.
```
*Pause 2 seconds on this.*

```
[PROLOG]  ✓ can_escalate(confirmed, 0.97) → TRUE
[LEAN4]   ✓ Theorem proved — finding has valid chain of custody
```
*Pause 1 second on each.*

```
[MIRROR]  Dual-cognition agreement → confidence elevated to 0.97
```
*Pause 2 seconds.*

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SWITCHING TO LIVE KILL FEED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

*At this exact moment — cut to Scene 4.*

---

# SCENE 4 — LIVE KILL FEED
# Duration: 1:30–2:00
# URL: collectivekitty.com/live-arena

**What to do:**

Navigate to `collectivekitty.com/live-arena`

Let it load and run for 15–20 seconds.

**What judges are looking for:**
- Real-time events scrolling
- Red events (blocks, kills)
- Green events (seals, approvals)
- This is the production platform — not a demo environment

**Overlay text (add in edit):**
```
Live production platform.
163 pages. 31 agents.
This is not a simulation.
```

---

# SCENE 5 — WAR ROOM
# Duration: 2:00–2:20
# URL: collectivekitty.com/war-room

**Navigate to `/war-room`**

Show for 10 seconds. Pan slowly if scrolling is needed.

**Then click `/war-room/nova`**
Show Nova agent activity for 5 seconds.

**Overlay text (add in edit):**
```
War Room.
Every agent. Every decision. Live.
```

---

# SCENE 6 — OBSERVABILITY LAYER
# Duration: 2:20–2:40
# URL: collectivekitty.com/obs

**Navigate to `/obs`**

Show the telemetry layer for 10 seconds.

**Then navigate to `/observer`**
Show for 5 seconds.

**Overlay text (add in edit):**
```
Phase-level telemetry.
Every reasoning step visible.
```

---

# SCENE 7 — FORTRESS + EVIDENCE CHAIN
# Duration: 2:40–3:00
# URL: collectivekitty.com/fortress

**Navigate to `/fortress`**

Show the constraint enforcement layer for 8 seconds.

**Then open new terminal tab (or split screen)**
Run:

```bash
cat cases/worm-chain.jsonl | python3 -m json.tool | head -60
```

Show the chain entries scrolling — seq numbers, seals, timestamps.

**Overlay text (add in edit):**
```
Every finding.
Sealed to the exact tool call that produced it.
Immutable. Verifiable. Exportable.
```

---

# SCENE 8 — GITHUB + CLOSE
# Duration: 3:00–3:20
# URL: github.com/SNAPKITTYWEST/agentscope-sift

**Browser: navigate to the GitHub repo.**

Show:
- README visible
- Tags (v1.0.0, v1.1.0) — click Releases
- MANIFEST.SHA256 file — show it exists
- cases/trust.pl — show the Prolog file
- cases/EvidenceChain.lean — show the Lean4 file

**Overlay text (add in edit):**
```
Open source. MIT license.
Every source file SHA-256 sealed.
Built for the DFIR community.
```

---

# SCENE 9 — CLOSE
# Duration: 3:20–3:40

**Black screen.**

Lines appear one at a time:

```
Don't trust the agent.

Observe it.
```

*3 second pause.*

```
AGENTSCOPE-SIFT

github.com/SNAPKITTYWEST/agentscope-sift
collectivekitty.com

Find Evil! Hackathon 2026
```

*Fade out.*

---

# NARRATION SCRIPT
# Record this LAST as one continuous track
# Calm, measured pace — not fast, not dramatic

---

**[Over Scene 1 — black screen]**

> "An AI-powered attacker can go from initial access to full domain control
> in under eight minutes.
> The defender is still pulling up their toolkit.
> That gap is the problem Protocol SIFT was built to close.
> But connecting AI agents to forensic tools creates a new problem:
> how do you trust what the agent found?"

---

**[Over Scene 2 — SIFT downloading and booting]**

> "AGENTSCOPE-SIFT runs on the SANS SIFT Workstation —
> the same platform sixty thousand incident responders download every year.
> One VM. Two hundred forensic tools. One install command."

---

**[Over Scene 3 — terminal running]**

> "The agent runs a five-phase investigation loop.
> Perceive. Reason. Plan. Act. Observe.
> It cannot skip phases. The state machine enforces this in code,
> not in a prompt."

*[When BOB BLOCKED appears]*

> "When the malware embedded an adversarial payload in its own strings output —
> trying to poison the analysis —
> BOB caught it.
> The LLM never saw the string.
> The block event was sealed to the chain."

*[When Prolog appears]*

> "Before the agent escalates any finding,
> the Prolog trust deed validates it.
> Valid seal. Correct trust score. Legal phase transition.
> Then Lean four proves the chain of custody holds mathematically."

*[When Mirror appears]*

> "A second agent instance boots cold from the sealed world state.
> Independent run. Same evidence. Same finding.
> Dual cognition agreement elevates confidence to ninety-seven percent."

---

**[Over Scene 4 — live-arena]*

> "This is the live platform.
> Not a demo environment.
> One hundred and sixty-three pages. Thirty-one agents.
> Every event you see is real."

---

**[Over Scene 5 — war-room]**

> "The war room shows every agent, every decision, every sector —
> in real time.
> This is the command center the investigation reports back to."

---

**[Over Scene 6 — obs/observer]**

> "AGENTSCOPE streams phase-level telemetry.
> Not just 'agent ran.'
> You see which phase took two hundred milliseconds.
> Which phase triggered a security gate.
> Which phase never completed because the agent was blocked."

---

**[Over Scene 7 — fortress + chain]**

> "Every finding in this chain
> maps to a sequence number,
> a tool call,
> a timestamp,
> and a cryptographic seal.
> A judge can take any finding from this report
> and trace it back to the exact forensic tool that produced it.
> This is chain of custody.
> For AI."

---

**[Over Scene 8 — GitHub]**

> "Open source. MIT license.
> Every source file SHA-256 sealed at release.
> Built for the DFIR community,
> by a team that runs this in production."

---

**[Over Scene 9 — black screen close]**

> "Existing tools give you observability.
>
> AGENTSCOPE gives you proof.
>
> Don't trust the agent.
>
> Observe it."

---

## EDITING ORDER

1. Record Scene 2 (SIFT download/boot) — do this while SIFT downloads
2. Record Scene 3 (terminal demo) — `node dist/demo.js` on SIFT VM
3. Record Scenes 4–7 (website) — screen record each page
4. Record Scene 8 (GitHub)
5. Build Scene 1 and Scene 9 in editor (text on black)
6. Assemble all scenes in order
7. Record narration as one continuous track over the full cut
8. Add text overlays from this script
9. Export 1080p

---

## CUT POINTS (exact)

| Timecode | Cut |
|---|---|
| 0:12 | Scene 1 → Scene 2 (SIFT boot) |
| 0:45 | Scene 2 → Scene 3 (terminal) |
| 1:30 | Scene 3 → Scene 4 (live-arena) — cut ON the SWITCHBOARD line |
| 2:00 | Scene 4 → Scene 5 (war-room) |
| 2:20 | Scene 5 → Scene 6 (obs) |
| 2:40 | Scene 6 → Scene 7 (fortress + chain) |
| 3:00 | Scene 7 → Scene 8 (GitHub) |
| 3:20 | Scene 8 → Scene 9 (black close) |
| 3:40 | End |
