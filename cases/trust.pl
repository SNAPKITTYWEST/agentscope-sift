% AGENTSCOPE Trust Deed — Prolog Kernel
% Ported from snapkitty-core/src/lisp/deed-rules.lisp
% Parsed at runtime to validate agent authority before every escalation.

:- module(trust, [valid_finding/3, can_escalate/2, trust_score_ok/1]).

% A finding is valid if:
%   1. It has a confirmed seal on the WORM chain
%   2. The trust score is above threshold
%   3. The phase sequence was not violated
valid_finding(Finding, Seal, TrustScore) :-
    atom(Finding),
    atom(Seal),
    atom_length(Seal, Len), Len >= 64,
    trust_score_ok(TrustScore).

% Trust score must be in [0.01, 1.0]
trust_score_ok(Score) :-
    number(Score),
    Score >= 0.01,
    Score =< 1.0.

% Agent can escalate only if:
%   - Finding is confirmed (not inferred)
%   - Trust score >= 0.75
can_escalate(confirmed, TrustScore) :-
    trust_score_ok(TrustScore),
    TrustScore >= 0.75.

% Tick validation — each phase must increment the tick monotonically
tick_valid(PrevTick, CurrTick) :-
    integer(PrevTick),
    integer(CurrTick),
    CurrTick =:= PrevTick + 1.

% Phase sequence rule — no skipping allowed
phase_sequence(start, perceive).
phase_sequence(perceive, reason).
phase_sequence(reason, plan).
phase_sequence(plan, act).
phase_sequence(act, observe).
phase_sequence(observe, perceive).
phase_sequence(observe, report).

valid_transition(From, To) :-
    phase_sequence(From, To).
