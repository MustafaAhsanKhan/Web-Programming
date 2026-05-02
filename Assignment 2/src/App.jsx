// ═══════════════════════════════════════════════════════════════════════════
// CRICKET BLAST - Main App Component
// ═══════════════════════════════════════════════════════════════════════════

// React hooks and utilities for state management, side effects, and refs
import React, { useState, useEffect, useRef, useCallback } from 'react';

// CSS modules for styling this component
import styles from './App.module.css';

// Game UI Components
import CricketField from './components/CricketField';      // Renders the cricket field and ball animation
import Scoreboard from './components/Scoreboard';          // Displays current runs, wickets, and balls bowled
import PowerBar from './components/PowerBar';              // Interactive power/timing slider for batting
import BattingStyleSelector from './components/BattingStyleSelector'; // Allows player to choose aggressive or defensive
import ResultDisplay from './components/ResultDisplay';    // Shows result of each ball (run, wicket, etc.)
import GameOver from './components/GameOver';              // Final game over screen with summary

// Custom hook that manages all game state logic
import { useGameState } from './hooks/useGameState';

// Probability tables for aggressive and defensive batting styles
import { AGGRESSIVE_PROBS, DEFENSIVE_PROBS } from './gameLogic';

// Duration of the bowling animation in milliseconds (how long the ball takes to reach the batter)
const BOWLING_DURATION = 1200; // ms

export default function App() {
  // ── Get game state and state-changing functions from the custom hook ──────
  // This hook manages the entire game logic including scoring, phase transitions, etc.
  const { state, selectStyle, onBowlingDone, playShot, nextBall, restart } = useGameState();
  
  // ── Local UI state for animations ──────────────────────────────────────────
  const [bowlingProgress, setBowlingProgress] = useState(0);      // Progress of bowling animation (0 to 1)
  const [battingTriggered, setBattingTriggered] = useState(false); // Flag to trigger batting animation
  
  // ── Refs to control animation frames and timing ────────────────────────────
  const bowlingRafRef = useRef(null);   // Reference to requestAnimationFrame for bowling animation
  const bowlingStartRef = useRef(null); // Timestamp when bowling animation started

  // ── Destructure game state for easier access ───────────────────────────────
  const {
    runs,              // Current total runs scored
    wickets,           // Number of wickets lost
    ballsBowled,       // Number of balls bowled so far
    battingStyle,      // Current batting style: 'aggressive' or 'defensive'
    phase,             // Current game phase: 'SELECT_STYLE', 'BOWLING', 'POWER_BAR', 'RESULT', 'GAME_OVER'
    lastOutcome,       // Result of the last ball
    gameOverReason,    // Reason why game ended
  } = state;

  // ── Determine which probability table to use based on batting style ────────
  // Aggressive style = higher risk, higher reward; Defensive = lower risk, lower reward
  const currentProbs =
    battingStyle === 'aggressive' ? AGGRESSIVE_PROBS : DEFENSIVE_PROBS;

  // ── EFFECT: Animate the bowling sequence (ball coming towards batter) ──────
  // Runs when phase changes to/from BOWLING
  // Creates a smooth animation over BOWLING_DURATION milliseconds
  // Updates bowlingProgress from 0 to 1, then calls onBowlingDone() when complete
  useEffect(() => {
    // Reset progress if not in bowling phase
    if (phase !== 'BOWLING') {
      setBowlingProgress(0);
      bowlingStartRef.current = null;
      return;
    }

    bowlingStartRef.current = null;

    // Animation callback: updates progress each frame
    function animate(ts) {
      // Initialize start time on first frame
      if (!bowlingStartRef.current) bowlingStartRef.current = ts;
      
      // Calculate how far through the animation we are (0 to 1)
      const elapsed = ts - bowlingStartRef.current;
      const progress = Math.min(elapsed / BOWLING_DURATION, 1);
      
      // Update UI with current progress
      setBowlingProgress(progress);
      
      // Continue animation if not done yet
      if (progress < 1) {
        bowlingRafRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete: trigger the power bar phase
        onBowlingDone();
      }
    }

    // Start the animation loop
    bowlingRafRef.current = requestAnimationFrame(animate);
    
    // Cleanup: cancel animation if component unmounts or phase changes
    return () => {
      if (bowlingRafRef.current) cancelAnimationFrame(bowlingRafRef.current);
    };
  }, [phase, onBowlingDone]);

  // ── EFFECT: Trigger batting animation when result is displayed ──────────────
  // Runs when phase changes to RESULT or GAME_OVER
  // Briefly sets a flag to trigger the batter animation on the cricket field
  useEffect(() => {
    // Only animate when we have a result to show or game has ended
    if (phase === 'RESULT' || phase === 'GAME_OVER') {
      setBattingTriggered(true);
      // Turn off the animation flag after 500ms
      const t = setTimeout(() => setBattingTriggered(false), 500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // ── EVENT HANDLER: Player selects a batting style ──────────────────────────
  // Wraps selectStyle from useGameState with useCallback to prevent unnecessary re-renders
  const handleSelectStyle = useCallback((style) => {
    selectStyle(style);
  }, [selectStyle]);

  // ── EVENT HANDLER: Player takes a shot (from the power bar) ────────────────
  // Called when player releases the power bar slider
  // sliderPos is a value typically between 0 and 1 indicating timing/power
  const handleShot = useCallback((sliderPos) => {
    playShot(sliderPos);
  }, [playShot]);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className={styles.app}>
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* HEADER: Game title and restart button */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🏏</span>
          <span className={styles.logoText}>CRICKET BLAST</span>
        </div>
        <button className={styles.restartHeaderBtn} onClick={restart} title="Restart Game">
          ↺ RESTART
        </button>
      </header>

      {/* Main game area */}
      <main className={styles.main}>
        <div className={styles.gameWrapper}>

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* CRICKET FIELD: Shows the field, ball animation, and result overlays */}
          {/* ────────────────────────────────────────────────────────────────── */}
          <div className={styles.fieldContainer}>
            {/* Cricket field with ball animation */}
            <CricketField
              phase={phase}
              bowlingProgress={bowlingProgress}
              battingTriggered={battingTriggered}
            />

            {/* Result overlay: Shows what happened on this ball (inside field) */}
            {phase === 'RESULT' && lastOutcome && (
              <ResultDisplay outcome={lastOutcome} onContinue={nextBall} />
            )}

            {/* Game Over overlay: Displayed when player gets out or completes target */}
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

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* SCOREBOARD: Displays runs, wickets, and balls bowled */}
          {/* ────────────────────────────────────────────────────────────────── */}
          <Scoreboard runs={runs} wickets={wickets} ballsBowled={ballsBowled} />

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* CONTROL PANEL: Style selector, status messages, power bar, legend */}
          {/* ────────────────────────────────────────────────────────────────── */}
          <div className={styles.controlPanel}>

            {/* Batting style selector: Active only during style selection phase */}
            <BattingStyleSelector
              selected={battingStyle}
              onSelect={handleSelectStyle}
              disabled={phase !== 'SELECT_STYLE'}
            />

            {/* Status message: "BALL INCOMING…" shown during bowling animation */}
            {phase === 'BOWLING' && (
              <div className={styles.statusMsg}>
                <span className={styles.dot} /> BALL INCOMING…
              </div>
            )}

            {/* Power bar: Interactive slider for timing/power selection */}
            {/* Shown only when ball has arrived and we're ready to bat */}
            {(phase === 'POWER_BAR') && battingStyle && (
              <PowerBar
                probs={currentProbs}
                onShot={handleShot}
                active={phase === 'POWER_BAR'}
              />
            )}

            {/* Probability legend: Shows outcomes and probabilities for current style */}
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
