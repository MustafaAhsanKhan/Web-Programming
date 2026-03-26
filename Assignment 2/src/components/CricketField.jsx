import React, { useRef, useEffect, useCallback } from 'react';
import styles from './CricketField.module.css';

/**
 * Side-on 2D cricket field view.
 *
 * Layout (left → right):
 *   Batsman + stumps  |  pitch (tan strip running full width)  |  Bowler + stumps
 *
 * Ball travels from bowler (right) → batsman (left) with a bounce arc.
 *
 * Props:
 *   phase            : string  — game phase
 *   bowlingProgress  : 0–1    — ball travel progress (0 = bowler end, 1 = batsman)
 *   battingTriggered : bool   — trigger bat swing animation
 */
export default function CricketField({ phase, bowlingProgress, battingTriggered }) {
  const canvasRef      = useRef(null);
  const batAngleRef    = useRef(0);      // degrees; positive = forward swing toward bowler
  const swingActiveRef = useRef(false);
  const swingFrameRef  = useRef(null);

  // ── Master draw (reads batAngleRef directly so swing RAF can call it) ─────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;   // 800
    const H = canvas.height;  // 340

    ctx.clearRect(0, 0, W, H);

    // ── Sky ─────────────────────────────────────────────────────────────
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.54);
    skyGrad.addColorStop(0, '#0d4a8a');
    skyGrad.addColorStop(1, '#5aaee8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.54);

    // ── Clouds ──────────────────────────────────────────────────────────
    drawCloud(ctx, W * 0.18, H * 0.10, 32);
    drawCloud(ctx, W * 0.52, H * 0.08, 44);
    drawCloud(ctx, W * 0.80, H * 0.13, 28);

    // ── Crowd stand ─────────────────────────────────────────────────────
    ctx.fillStyle = '#4a2508';
    ctx.fillRect(0, H * 0.44, W, H * 0.11);
    for (let i = 0; i < 90; i++) {
      const cx = (i / 90) * W + 5;
      const cy = H * 0.45 + (i % 4) * 6;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = ['#e74c3c','#3498db','#f1c40f','#2ecc71','#fff','#e67e22','#9b59b6'][i % 7];
      ctx.fill();
    }

    // ── Outfield grass ──────────────────────────────────────────────────
    const groundY = H * 0.54;
    const grassGrad = ctx.createLinearGradient(0, groundY, 0, H);
    grassGrad.addColorStop(0, '#2d8c2d');
    grassGrad.addColorStop(1, '#1a5c1a');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, groundY, W, H - groundY);

    // Vertical mowing stripes (side-on view depth cue)
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.025)';
      ctx.fillRect(i * (W / 12), groundY, W / 12, H - groundY);
    }

    // ── Pitch strip (full width, lower portion of grass) ────────────────
    const pitchTop    = groundY + (H - groundY) * 0.15;
    const pitchBottom = groundY + (H - groundY) * 0.62;
    const pitchH      = pitchBottom - pitchTop;

    const pitchGrad = ctx.createLinearGradient(0, pitchTop, 0, pitchBottom);
    pitchGrad.addColorStop(0, '#c8a96e');
    pitchGrad.addColorStop(1, '#b8954e');
    ctx.fillStyle = pitchGrad;
    ctx.fillRect(0, pitchTop, W, pitchH);

    // Pitch edge shadows
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.fillRect(0, pitchTop, W, 3);
    ctx.fillRect(0, pitchBottom - 3, W, 3);

    // ── Ground baseline (feet rest here) ────────────────────────────────
    const footY = pitchBottom + 2;

    // ── Key X positions ─────────────────────────────────────────────────
    const batsmanStumpX = W * 0.13;   // batting stumps
    const bowlerStumpX  = W * 0.87;   // bowling stumps

    // ── Crease lines ────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth   = 2;
    const lines = [
      batsmanStumpX - 28,   // batting crease (behind stumps)
      batsmanStumpX + 22,   // popping crease (batsman end)
      bowlerStumpX  - 22,   // popping crease (bowler end)
      bowlerStumpX  + 28,   // bowling crease
    ];
    lines.forEach((lx) => {
      ctx.beginPath();
      ctx.moveTo(lx, pitchTop - 2);
      ctx.lineTo(lx, pitchBottom + 2);
      ctx.stroke();
    });

    // ── Stumps (both ends) ──────────────────────────────────────────────
    const stumpBaseY = pitchTop;      // stumps grow upward from pitch surface
    drawStumps(ctx, batsmanStumpX, stumpBaseY, footY);
    drawStumps(ctx, bowlerStumpX,  stumpBaseY, footY);

    // ── Batsman ─────────────────────────────────────────────────────────
    const batsmanX = batsmanStumpX + 30;
    drawBatsman(ctx, batsmanX, footY, batAngleRef.current);

    // ── Bowler ──────────────────────────────────────────────────────────
    const bowlerX = bowlerStumpX - 52;
    drawBowler(ctx, bowlerX, footY);

    // ── Ball ────────────────────────────────────────────────────────────
    if (phase === 'BOWLING' || phase === 'POWER_BAR') {
      // Ball travels RIGHT → LEFT
      const ballStartX = bowlerStumpX - 8;
      const ballEndX   = batsmanStumpX + 12;

      // Release height and bat-contact height
      const releaseY  = footY - pitchH * 0.55;
      const contactY  = footY - pitchH * 0.62;
      const bounceY   = footY - 6;             // nearly at pitch surface

      const prog = phase === 'POWER_BAR' ? 1 : bowlingProgress;

      let bx, by;
      bx = ballStartX + (ballEndX - ballStartX) * prog;

      if (prog < 0.48) {
        // First half: release → bounce point
        const t = prog / 0.48;
        by = releaseY + (bounceY - releaseY) * easeIn(t);
      } else {
        // Second half: bounce → bat contact
        const t = (prog - 0.48) / 0.52;
        by = bounceY + (contactY - bounceY) * easeOut(t);
      }

      drawBall(ctx, bx, by);
    }

    // ── Player labels ────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.font = 'bold 10px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BATSMAN', batsmanX, H - 4);
    ctx.fillText('BOWLER',  bowlerX,  H - 4);

  }, [phase, bowlingProgress]);

  // Redraw on prop changes
  useEffect(() => {
    draw();
  }, [draw]);

  // ── Bat swing animation ──────────────────────────────────────────────────
  useEffect(() => {
    if (!battingTriggered) {
      batAngleRef.current = 0;
      swingActiveRef.current = false;
      if (swingFrameRef.current) cancelAnimationFrame(swingFrameRef.current);
      draw();
      return;
    }

    swingActiveRef.current = true;
    let start = null;
    const DURATION = 480;

    function animate(ts) {
      if (!start) start = ts;
      const t = Math.min((ts - start) / DURATION, 1);

      // Forward swing then return
      const angle = t < 0.45
        ? easeOut(t / 0.45) * 80
        : easeOut((1 - t) / 0.55) * 80;
      batAngleRef.current = angle;

      draw();

      if (t < 1 && swingActiveRef.current) {
        swingFrameRef.current = requestAnimationFrame(animate);
      } else {
        batAngleRef.current = 0;
        draw();
      }
    }

    swingFrameRef.current = requestAnimationFrame(animate);
    return () => {
      swingActiveRef.current = false;
      if (swingFrameRef.current) cancelAnimationFrame(swingFrameRef.current);
    };
  }, [battingTriggered, draw]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={340}
      className={styles.canvas}
    />
  );
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────

function drawCloud(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.beginPath(); ctx.arc(x,           y,           r,        0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.85, y + r * 0.15, r * 0.68, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - r * 0.72, y + r * 0.22, r * 0.58, 0, Math.PI * 2); ctx.fill();
}

/**
 * Stumps — side-on silhouette.
 * stumpBaseY = top of pitch surface (stumps planted here, visible portion rises above)
 * footY      = ground/foot level
 */
function drawStumps(ctx, cx, stumpBaseY, footY) {
  const totalH = footY - stumpBaseY;
  const visH   = totalH * 0.52;         // portion above pitch surface
  const topY   = stumpBaseY - visH;

  ctx.fillStyle = '#f5deb3';
  [-7, 0, 7].forEach((dx) => {
    ctx.fillRect(cx + dx - 2, topY, 4, visH);
  });

  // Bails
  ctx.fillStyle = '#d4a017';
  ctx.fillRect(cx - 10, topY - 5, 20, 4);
  ctx.fillRect(cx - 4,  topY - 8, 8,  5);
}

/**
 * Batsman — side-on, facing RIGHT (toward the bowler).
 * batAngle > 0 means bat sweeps toward bowler (forward/horizontal swing).
 */
function drawBatsman(ctx, cx, footY, batAngle) {
  ctx.save();
  ctx.translate(cx, footY);

  // ── Shoes ───────────────────────────────────────────────────────────
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.roundRect(-8, -8,  14, 8, 2); ctx.fill();   // back foot
  ctx.beginPath(); ctx.roundRect(12, -8,  14, 8, 2); ctx.fill();   // front foot

  // ── Pads ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath(); ctx.roundRect(-8, -46,  13, 40, 3); ctx.fill();  // back leg
  ctx.beginPath(); ctx.roundRect(12, -46,  13, 40, 3); ctx.fill();  // front leg

  // Pad straps
  ctx.fillStyle = '#bbb';
  [-36, -26, -16].forEach((dy) => {
    ctx.fillRect(-8,  dy, 13, 3);
    ctx.fillRect(12, dy, 13, 3);
  });

  // ── Jersey ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#1d8348';
  ctx.beginPath(); ctx.roundRect(-11, -92, 34, 48, 5); ctx.fill();

  // Badge
  ctx.fillStyle = '#f0e040';
  ctx.fillRect(2, -82, 12, 13);

  // ── Neck ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#c68642';
  ctx.fillRect(3, -97, 9, 8);

  // ── Helmet ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#1d8348';
  ctx.beginPath(); ctx.arc(8, -102, 17, Math.PI, 0); ctx.fill();
  ctx.fillRect(-9, -106, 34, 9);

  // Visor (pointing right toward bowler)
  ctx.fillStyle = '#d4ac0d';
  ctx.beginPath();
  ctx.moveTo(22, -106);
  ctx.lineTo(36, -98);
  ctx.lineTo(22, -98);
  ctx.closePath();
  ctx.fill();

  // Face guard
  ctx.strokeStyle = '#777';
  ctx.lineWidth = 1.5;
  [0, 4, 8].forEach((dx) => {
    ctx.beginPath();
    ctx.moveTo(22 + dx, -104);
    ctx.lineTo(22 + dx, -95);
    ctx.stroke();
  });

  // ── Back arm ────────────────────────────────────────────────────────
  ctx.fillStyle = '#1d8348';
  ctx.save();
  ctx.translate(-8, -84);
  ctx.rotate((-25 * Math.PI) / 180);
  ctx.fillRect(-4, 0, 8, 22);
  ctx.restore();

  // ── Front arm ───────────────────────────────────────────────────────
  ctx.fillStyle = '#1d8348';
  ctx.save();
  ctx.translate(20, -84);
  ctx.rotate((15 * Math.PI) / 180);
  ctx.fillRect(-4, 0, 8, 20);
  ctx.restore();

  // ── Bat ─────────────────────────────────────────────────────────────
  // Pivot at hands; positive batAngle = sweep forward (toward bowler = right)
  ctx.save();
  ctx.translate(20, -64);
  ctx.rotate((batAngle * Math.PI) / 180);

  // Handle
  ctx.fillStyle = '#6b3410';
  ctx.fillRect(-3, -32, 6, 32);
  // Grip tape
  ctx.fillStyle = '#444';
  [-28, -22, -16, -10, -4].forEach((dy) => {
    ctx.fillRect(-3, dy, 6, 4);
  });

  // Blade
  ctx.fillStyle = '#c8a96e';
  ctx.beginPath();
  ctx.roundRect(-7, 0, 15, 48, [2, 2, 7, 7]);
  ctx.fill();

  // Blade edge highlight
  ctx.fillStyle = '#dab97e';
  ctx.fillRect(6, 0, 3, 48);

  ctx.restore();
  ctx.restore();
}

/**
 * Bowler — side-on, facing LEFT (toward batsman), in delivery stride.
 */
function drawBowler(ctx, cx, footY) {
  ctx.save();
  ctx.translate(cx, footY);

  // ── Shoes ───────────────────────────────────────────────────────────
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.roundRect(-20, -8, 13, 8, 2); ctx.fill();   // back foot
  ctx.beginPath(); ctx.roundRect(4,   -8, 13, 8, 2); ctx.fill();   // front foot (stride)

  // ── Trousers ────────────────────────────────────────────────────────
  ctx.fillStyle = '#f0f0f0';
  ctx.beginPath(); ctx.roundRect(-18, -44, 12, 38, 3); ctx.fill();  // back leg
  ctx.beginPath(); ctx.roundRect(5,   -44, 12, 38, 3); ctx.fill();  // front leg (stride)

  // ── Jersey ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#c0392b';
  ctx.beginPath(); ctx.roundRect(-15, -88, 30, 46, 5); ctx.fill();

  // ── Neck ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#c68642';
  ctx.fillRect(-4, -94, 8, 9);

  // ── Head / cap ──────────────────────────────────────────────────────
  ctx.fillStyle = '#c0392b';
  ctx.beginPath(); ctx.arc(-1, -100, 14, Math.PI, 0); ctx.fill();
  ctx.fillRect(-15, -104, 28, 8);

  // Cap brim (facing left)
  ctx.fillStyle = '#8b1e15';
  ctx.beginPath();
  ctx.moveTo(-15, -102);
  ctx.lineTo(-28, -96);
  ctx.lineTo(-15, -96);
  ctx.closePath();
  ctx.fill();

  // ── Bowling arm (raised high) ────────────────────────────────────────
  ctx.fillStyle = '#c0392b';
  ctx.save();
  ctx.translate(12, -80);
  ctx.rotate((-120 * Math.PI) / 180);
  ctx.fillRect(-4, 0, 8, 28);
  // Hand / ball
  ctx.fillStyle = '#c68642';
  ctx.beginPath(); ctx.arc(0, 28, 6, 0, Math.PI * 2); ctx.fill();
  // Hint of ball in hand
  ctx.fillStyle = '#c0392b';
  ctx.beginPath(); ctx.arc(0, 28, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── Balance arm ─────────────────────────────────────────────────────
  ctx.fillStyle = '#c0392b';
  ctx.save();
  ctx.translate(-12, -78);
  ctx.rotate((45 * Math.PI) / 180);
  ctx.fillRect(-3, 0, 7, 22);
  ctx.restore();

  ctx.restore();
}

function drawBall(ctx, x, y) {
  // Drop shadow
  ctx.beginPath();
  ctx.ellipse(x, y + 11, 9, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.fill();

  // Ball
  const grad = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, 10);
  grad.addColorStop(0, '#e74c3c');
  grad.addColorStop(1, '#7b241c');
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Seam lines (horizontal arc — side-on silhouette)
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, 7, -0.6, 0.6);             ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 7, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function easeIn(t)  { return t * t * t; }
