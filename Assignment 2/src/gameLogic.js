// ─── Game Constants ───────────────────────────────────────────────────────────
export const TOTAL_OVERS = 2;
export const BALLS_PER_OVER = 6;
export const TOTAL_BALLS = TOTAL_OVERS * BALLS_PER_OVER; // 12
export const TOTAL_WICKETS = 2;

// ─── Probability Distributions ────────────────────────────────────────────────
// Each outcome has: label, runs value (-1 = wicket), probability, color
export const AGGRESSIVE_PROBS = [
  { label: 'Wicket', runs: -1, prob: 0.35, color: 'var(--bar-wicket)' },
  { label: '0',      runs: 0,  prob: 0.10, color: 'var(--bar-0)' },
  { label: '1',      runs: 1,  prob: 0.10, color: 'var(--bar-1)' },
  { label: '2',      runs: 2,  prob: 0.10, color: 'var(--bar-2)' },
  { label: '3',      runs: 3,  prob: 0.05, color: 'var(--bar-3)' },
  { label: '4',      runs: 4,  prob: 0.15, color: 'var(--bar-4)' },
  { label: '6',      runs: 6,  prob: 0.15, color: 'var(--bar-6)' },
];

export const DEFENSIVE_PROBS = [
  { label: 'Wicket', runs: -1, prob: 0.15, color: 'var(--bar-wicket)' },
  { label: '0',      runs: 0,  prob: 0.30, color: 'var(--bar-0)' },
  { label: '1',      runs: 1,  prob: 0.25, color: 'var(--bar-1)' },
  { label: '2',      runs: 2,  prob: 0.15, color: 'var(--bar-2)' },
  { label: '3',      runs: 3,  prob: 0.05, color: 'var(--bar-3)' },
  { label: '4',      runs: 4,  prob: 0.07, color: 'var(--bar-4)' },
  { label: '6',      runs: 6,  prob: 0.03, color: 'var(--bar-6)' },
];

// ─── Resolve Outcome from slider position (0–1) ───────────────────────────────
export function resolveOutcome(sliderPos, probs) {
  let cumulative = 0;
  for (const segment of probs) {
    cumulative += segment.prob;
    if (sliderPos <= cumulative) return segment;
  }
  // Fallback to last segment (floating point edge)
  return probs[probs.length - 1];
}

// ─── Build cumulative boundary positions for the power bar ────────────────────
export function buildSegments(probs) {
  const segments = [];
  let cumulative = 0;
  for (const p of probs) {
    segments.push({ ...p, start: cumulative, end: cumulative + p.prob });
    cumulative += p.prob;
  }
  return segments;
}

// ─── Format overs display ─────────────────────────────────────────────────────
export function formatOvers(ballsBowled) {
  const completedOvers = Math.floor(ballsBowled / BALLS_PER_OVER);
  const ballsInOver = ballsBowled % BALLS_PER_OVER;
  return `${completedOvers}.${ballsInOver}`;
}
