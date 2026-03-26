import React from 'react';
import styles from './BattingStyleSelector.module.css';

export default function BattingStyleSelector({ selected, onSelect, disabled }) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.prompt}>SELECT BATTING STYLE</p>
      <div className={styles.buttons}>
        <button
          className={`${styles.btn} ${styles.aggressive} ${selected === 'aggressive' ? styles.active : ''}`}
          onClick={() => !disabled && onSelect('aggressive')}
          disabled={disabled}
          aria-pressed={selected === 'aggressive'}
        >
          <span className={styles.icon}>⚡</span>
          <span className={styles.name}>AGGRESSIVE</span>
          <span className={styles.desc}>High Risk · High Reward</span>
        </button>

        <button
          className={`${styles.btn} ${styles.defensive} ${selected === 'defensive' ? styles.active : ''}`}
          onClick={() => !disabled && onSelect('defensive')}
          disabled={disabled}
          aria-pressed={selected === 'defensive'}
        >
          <span className={styles.icon}>🛡</span>
          <span className={styles.name}>DEFENSIVE</span>
          <span className={styles.desc}>Low Risk · Safe Runs</span>
        </button>
      </div>
    </div>
  );
}
