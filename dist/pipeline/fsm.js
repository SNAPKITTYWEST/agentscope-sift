/**
 * IR State Machine — 5-Phase Agentic Loop
 *
 * perceive → reason → plan → act → observe → (loop or report)
 *
 * The agent CANNOT skip phases. Every transition is validated.
 * Ported from snapkitty-core/src/agent_fsm.rs — the FSM that keeps reasoning on rails.
 */
const VALID_TRANSITIONS = {
    start: ['perceive'],
    perceive: ['reason', 'aborted'],
    reason: ['plan', 'aborted'],
    plan: ['act', 'aborted'],
    act: ['observe', 'aborted'],
    observe: ['perceive', 'report', 'aborted'],
    report: [],
    aborted: [],
};
export class IRFSM {
    current = 'start';
    history = [];
    phaseStart = Date.now();
    iteration = 0;
    maxIterations;
    constructor(maxIterations = 10) {
        this.maxIterations = maxIterations;
    }
    get phase() { return this.current; }
    get records() { return this.history; }
    get iter() { return this.iteration; }
    enter(next, input) {
        const allowed = VALID_TRANSITIONS[this.current];
        if (!allowed.includes(next)) {
            throw new Error(`Invalid transition: ${this.current} → ${next}. Allowed: ${allowed.join(', ')}`);
        }
        const now = Date.now();
        if (this.history.length > 0) {
            const last = this.history[this.history.length - 1];
            last.ended_at = new Date().toISOString();
            last.duration_ms = now - this.phaseStart;
        }
        this.history.push({
            phase: next,
            started_at: new Date().toISOString(),
            input,
        });
        if (next === 'perceive' && this.current !== 'start')
            this.iteration++;
        if (this.iteration > this.maxIterations) {
            this.current = 'aborted';
            throw new Error(`Max iterations (${this.maxIterations}) reached — aborting to prevent runaway execution`);
        }
        this.current = next;
        this.phaseStart = now;
    }
    record(output, confidence) {
        const last = this.history[this.history.length - 1];
        if (last) {
            last.output = output;
            last.confidence = confidence;
        }
    }
    summary() {
        return this.history
            .map(r => `[${r.phase.toUpperCase()}] ${r.duration_ms ?? '?'}ms${r.confidence !== undefined ? ` conf=${r.confidence.toFixed(2)}` : ''}`)
            .join(' → ');
    }
}
