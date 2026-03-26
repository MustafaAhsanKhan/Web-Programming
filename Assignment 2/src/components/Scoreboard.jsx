import React from 'react';
import styles from './Scoreboard.module.css';
import { TOTAL_WICKETS, TOTAL_BALLS, formatOvers } from '../gameLogic';

export default function Scoreboard({ runs, wickets, ballsBowled }) {
  const ballsRemaining = TOTAL_BALLS - ballsBowled;
  const oversDisplay = formatOvers(ballsBowled);
  const totalOversDisplay = formatOvers(TOTAL_BALLS);

  return (
    <div className={styles.board}>
      <div className={styles.title}>SCOREBOARD</div>
      <div className={styles.grid}>
        <div className={styles.cell}>
          <span className={styles.value}>{runs}</span>
          <span className={styles.label}>RUNS</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.cell}>
          <span className={styles.value}>
            {wickets}<span className={styles.slash}>/</span>{TOTAL_WICKETS}
          </span>
          <span className={styles.label}>WICKETS</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.cell}>
          <span className={styles.value}>{oversDisplay}</span>
          <span className={styles.label}>OVERS ({totalOversDisplay})</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.cell}>
          <span className={`${styles.value} ${ballsRemaining <= 3 ? styles.urgent : ''}`}>
            {ballsRemaining}
          </span>
          <span className={styles.label}>BALLS LEFT</span>
        </div>
      </div>
    </div>
  );
}
