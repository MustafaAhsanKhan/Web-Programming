import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './App.module.css';
import CricketField from './components/CricketField';
import Scoreboard from './components/Scoreboard';
import PowerBar from './components/PowerBar';
import BattingStyleSelector from './components/BattingStyleSelector';
import ResultDisplay from './components/ResultDisplay';
import GameOver from './components/GameOver';
import { useGameState } from './hooks/useGameState';
import { AGGRESSIVE_PROBS, DEFENSIVE_PROBS } from './gameLogic';

const BOWLING_DURATION = 1200; // ms

export default function App() {
  const { state, selectStyle, onBowlingDone, playShot, nextBall, restart } = useGameState();
  const [bowlingProgress, setBowlingProgress] = useState(0);
  const [battingTriggered, setBattingTriggered] = useState(false);
  const bowlingRafRef = useRef(null);
  const bowlingStartRef = useRef(null);

  const {
    runs, wickets, ballsBowled,
    battingStyle, phase,
    lastOutcome, gameOverReason,
  } = state;

  const currentProbs =
    battingStyle === 'aggressive' ? AGGRESSIVE_PROBS : DEFENSIVE_PROBS;

  // ── Bowling animation ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'BOWLING') {
      setBowlingProgress(0);
      bowlingStartRef.current = null;
      return;
    }

    bowlingStartRef.current = null;

    function animate(ts) {
      if (!bowlingStartRef.current) bowlingStartRef.current = ts;
      const elapsed = ts - bowlingStartRef.current;
      const progress = Math.min(elapsed / BOWLING_DURATION, 1);
      setBowlingProgress(progress);
      if (progress < 1) {
        bowlingRafRef.current = requestAnimationFrame(animate);
      } else {
        onBowlingDone();
      }
    }

    bowlingRafRef.current = requestAnimationFrame(animate);
    return () => {
      if (bowlingRafRef.current) cancelAnimationFrame(bowlingRafRef.current);
    };
  }, [phase, onBowlingDone]);

  // ── Batting animation on shot ─────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'RESULT' || phase === 'GAME_OVER') {
      setBattingTriggered(true);
      const t = setTimeout(() => setBattingTriggered(false), 500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // ── Handle style selection → trigger bowling ───────────────────────────────
  const handleSelectStyle = useCallback((style) => {
    selectStyle(style);
  }, [selectStyle]);

  // ── Handle shot from power bar ─────────────────────────────────────────────
  const handleShot = useCallback((sliderPos) => {
    playShot(sliderPos);
  }, [playShot]);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🏏</span>
          <span className={styles.logoText}>CRICKET BLAST</span>
        </div>
        <button className={styles.restartHeaderBtn} onClick={restart} title="Restart Game">
          ↺ RESTART
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.gameWrapper}>

          {/* ── Field + overlays ───────────────────────────────────────── */}
          <div className={styles.fieldContainer}>
            <CricketField
              phase={phase}
              bowlingProgress={bowlingProgress}
              battingTriggered={battingTriggered}
            />

            {/* Result flash overlay (inside field) */}
            {phase === 'RESULT' && lastOutcome && (
              <ResultDisplay outcome={lastOutcome} onContinue={nextBall} />
            )}

            {/* Game Over overlay */}
            {phase === 'GAME_OVER' && (
              <GameOver
                runs={runs}
                wickets={wickets}
                ballsBowled={ballsBowled}
                reason={gameOverReason}
                onRestart={restart}
              />
            )}
          </div>

          {/* ── Scoreboard ─────────────────────────────────────────────── */}
          <Scoreboard runs={runs} wickets={wickets} ballsBowled={ballsBowled} />

          {/* ── Control panel ──────────────────────────────────────────── */}
          <div className={styles.controlPanel}>

            {/* Style selector — shown when choosing or during play */}
            <BattingStyleSelector
              selected={battingStyle}
              onSelect={handleSelectStyle}
              disabled={phase !== 'SELECT_STYLE'}
            />

            {/* Bowling message */}
            {phase === 'BOWLING' && (
              <div className={styles.statusMsg}>
                <span className={styles.dot} /> BALL INCOMING…
              </div>
            )}

            {/* Power bar — shown when ball has arrived */}
            {(phase === 'POWER_BAR') && battingStyle && (
              <PowerBar
                probs={currentProbs}
                onShot={handleShot}
                active={phase === 'POWER_BAR'}
              />
            )}

            {/* Probability legend */}
            {battingStyle && (
              <div className={styles.legend}>
                {currentProbs.map((p) => (
                  <div key={p.label} className={styles.legendItem}>
                    <span className={styles.legendSwatch} style={{ background: p.color }} />
                    <span className={styles.legendLabel}>{p.label}</span>
                    <span className={styles.legendProb}>{(p.prob * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
