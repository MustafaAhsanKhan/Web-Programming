import React, { useEffect, useState } from 'react';
import styles from './ResultDisplay.module.css';

const RESULT_CONFIG = {
  '-1': { label: 'WICKET!', color: '#e74c3c', emoji: '💥' },
  '0':  { label: 'DOT BALL', color: '#e67e22', emoji: '●' },
  '1':  { label: '1 RUN',   color: '#f1c40f', emoji: '🏃' },
  '2':  { label: '2 RUNS',  color: '#2ecc71', emoji: '🏃🏃' },
  '3':  { label: '3 RUNS',  color: '#1abc9c', emoji: '✦' },
  '4':  { label: 'FOUR!',   color: '#3498db', emoji: '🏏' },
  '6':  { label: 'SIX!',    color: '#9b59b6', emoji: '🚀' },
};

export default function ResultDisplay({ outcome, onContinue }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (outcome) {
      setVisible(true);
    }
  }, [outcome]);

  if (!outcome) return null;

  const cfg = RESULT_CONFIG[String(outcome.runs)] || { label: outcome.label, color: '#fff', emoji: '?' };

  return (
    <div className={`${styles.overlay} ${visible ? styles.in : ''}`}>
      <div className={styles.card} style={{ borderColor: cfg.color, boxShadow: `0 0 30px ${cfg.color}55` }}>
        <div className={styles.emoji}>{cfg.emoji}</div>
        <div className={styles.result} style={{ color: cfg.color }}>{cfg.label}</div>
        {outcome.runs > 0 && (
          <div className={styles.runs}>+{outcome.runs} run{outcome.runs !== 1 ? 's' : ''}</div>
        )}
        <button className={styles.btn} onClick={onContinue} style={{ borderColor: cfg.color, color: cfg.color }}>
          NEXT BALL →
        </button>
      </div>
    </div>
  );
}
