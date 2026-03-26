import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './PowerBar.module.css';
import { buildSegments } from '../gameLogic';

const SLIDER_SPEED = 0.008; // units per frame (0–1 range)

/**
 * Props:
 *   probs: array of probability objects
 *   onShot: (sliderPos: number) => void
 *   active: boolean — whether the power bar is interactive
 */
export default function PowerBar({ probs, onShot, active }) {
  const [sliderPos, setSliderPos] = useState(0);
  const [direction, setDirection] = useState(1);
  const [fired, setFired] = useState(false);
  const rafRef = useRef(null);
  const posRef = useRef(0);
  const dirRef = useRef(1);

  const segments = buildSegments(probs);

  // Animate slider back and forth
  useEffect(() => {
    if (!active || fired) return;

    posRef.current = 0;
    dirRef.current = 1;
    setSliderPos(0);
    setDirection(1);

    function step() {
      posRef.current += SLIDER_SPEED * dirRef.current;
      if (posRef.current >= 1) {
        posRef.current = 1;
        dirRef.current = -1;
      } else if (posRef.current <= 0) {
        posRef.current = 0;
        dirRef.current = 1;
      }
      setSliderPos(posRef.current);
      setDirection(dirRef.current);
      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, fired]);

  // Reset when probs change (new ball)
  useEffect(() => {
    setFired(false);
    setSliderPos(0);
  }, [probs, active]);

  const handleClick = useCallback(() => {
    if (!active || fired) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setFired(true);
    onShot(posRef.current);
  }, [active, fired, onShot]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>POWER BAR</span>
        <span className={styles.hint}>
          {active && !fired ? '▶ CLICK TO PLAY SHOT' : ''}
        </span>
      </div>

      {/* Probability labels */}
      <div className={styles.segmentLabels}>
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={styles.segLabel}
            style={{ width: `${seg.prob * 100}%` }}
          >
            {seg.label}
          </div>
        ))}
      </div>

      {/* The bar itself */}
      <div
        className={`${styles.bar} ${active && !fired ? styles.clickable : ''}`}
        onClick={handleClick}
        role="button"
        tabIndex={active && !fired ? 0 : -1}
        onKeyDown={(e) => e.key === ' ' || e.key === 'Enter' ? handleClick() : null}
        aria-label="Power bar – click to play shot"
      >
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={styles.segment}
            style={{ width: `${seg.prob * 100}%`, background: seg.color }}
          />
        ))}

        {/* Slider indicator */}
        <div
          className={styles.slider}
          style={{ left: `${sliderPos * 100}%` }}
        >
          <div className={styles.sliderArrow}>▼</div>
          <div className={styles.sliderLine} />
        </div>
      </div>

      {/* Probability scale ticks */}
      <div className={styles.scale}>
        {segments.map((seg) => (
          <div
            key={seg.label + '-tick'}
            className={styles.tick}
            style={{ left: `${seg.end * 100}%` }}
          >
            {seg.end.toFixed(2)}
          </div>
        ))}
        <div className={styles.tick} style={{ left: '0%', transform: 'none' }}>0</div>
      </div>
    </div>
  );
}
