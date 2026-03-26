import React from 'react';
import styles from './GameOver.module.css';

export default function GameOver({ runs, wickets, ballsBowled, reason, onRestart }) {
  const title = reason === 'wickets' ? 'ALL OUT!' : 'INNINGS COMPLETE';
  const subtitle = reason === 'wickets'
    ? 'The last wicket has fallen.'
    : 'You have faced all your overs.';

  const strikeRate = ballsBowled > 0 ? ((runs / ballsBowled) * 100).toFixed(1) : '0.0';

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.titleBar}>
          <span className={styles.icon}>{reason === 'wickets' ? '💥' : '🏏'}</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{runs}</span>
            <span className={styles.statLabel}>TOTAL RUNS</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{wickets}</span>
            <span className={styles.statLabel}>WICKETS LOST</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{ballsBowled}</span>
            <span className={styles.statLabel}>BALLS FACED</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{strikeRate}</span>
            <span className={styles.statLabel}>STRIKE RATE</span>
          </div>
        </div>

        <button className={styles.restartBtn} onClick={onRestart}>
          🔄 PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
