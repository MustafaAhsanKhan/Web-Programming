import { useState, useCallback } from 'react';
import {
  TOTAL_BALLS,
  TOTAL_WICKETS,
  AGGRESSIVE_PROBS,
  DEFENSIVE_PROBS,
  resolveOutcome,
} from '../gameLogic';

// Phase: 'SELECT_STYLE' | 'BOWLING' | 'POWER_BAR' | 'RESULT' | 'GAME_OVER'
const INITIAL_STATE = {
  runs: 0,
  wickets: 0,
  ballsBowled: 0,
  battingStyle: null,   // 'aggressive' | 'defensive'
  phase: 'SELECT_STYLE',
  lastOutcome: null,    // { label, runs }
  gameOverReason: null, // 'overs' | 'wickets'
};

export function useGameState() {
  const [state, setState] = useState(INITIAL_STATE);

  // Called when user picks a batting style
  const selectStyle = useCallback((style) => {
    setState((s) => ({ ...s, battingStyle: style, phase: 'BOWLING' }));
  }, []);

  // Called when bowling animation finishes → show power bar
  const onBowlingDone = useCallback(() => {
    setState((s) => ({ ...s, phase: 'POWER_BAR' }));
  }, []);

  // Called when user clicks the power bar (sliderPos: 0–1)
  const playShot = useCallback((sliderPos) => {
    setState((s) => {
      const probs =
        s.battingStyle === 'aggressive' ? AGGRESSIVE_PROBS : DEFENSIVE_PROBS;
      const outcome = resolveOutcome(sliderPos, probs);

      const isWicket = outcome.runs === -1;
      const newWickets = isWicket ? s.wickets + 1 : s.wickets;
      const newRuns = isWicket ? s.runs : s.runs + outcome.runs;
      const newBalls = s.ballsBowled + 1;

      const isGameOver =
        newWickets >= TOTAL_WICKETS || newBalls >= TOTAL_BALLS;

      let gameOverReason = null;
      if (isGameOver) {
        gameOverReason = newWickets >= TOTAL_WICKETS ? 'wickets' : 'overs';
      }

      return {
        ...s,
        runs: newRuns,
        wickets: newWickets,
        ballsBowled: newBalls,
        lastOutcome: outcome,
        phase: isGameOver ? 'GAME_OVER' : 'RESULT',
        gameOverReason,
      };
    });
  }, []);

  // After result display → go back to style selection for next ball
  const nextBall = useCallback(() => {
    setState((s) => ({ ...s, phase: 'SELECT_STYLE', lastOutcome: null, battingStyle: null }));
  }, []);

  // Full restart
  const restart = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { state, selectStyle, onBowlingDone, playShot, nextBall, restart };
}
