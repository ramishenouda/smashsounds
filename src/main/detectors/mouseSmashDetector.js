'use strict';

const settings = require('../settingsStore');

/**
 * Detects a mouse "smash" — distinct from fast movement.
 *
 * Algorithm: rolling velocity buffer (~200 ms window).
 *
 *   A smash fires when BOTH of the following are true:
 *   1. Peak speed in the recent window exceeds the user threshold (px/s).
 *      This means the mouse was actually moving fast — not just a micro-jerk.
 *   2. Current speed drops to < DROP_RATIO of that peak (default 15%).
 *      i.e., the mouse suddenly slammed to a stop.
 *
 *   OR: sharp direction reversal while moving fast:
 *   - dot(v_prev, v_curr) / (|v_prev| * |v_curr|) < REVERSAL_COS (< -0.7 = >135°)
 *   - AND both speeds exceed MIN_REVERSAL_SPEED (40% of threshold)
 *
 * This cleanly avoids false-triggering on sustained fast movement,
 * which never has a velocity collapse or sharp reversal.
 */

const WINDOW_MS       = 200;   // rolling window to track peak speed
const DROP_RATIO      = 0.15;  // current speed must be < 15% of peak
const REVERSAL_COS    = -0.70; // cos(135°) — direction must flip at least 135°
const MIN_SPEED_RATIO = 0.40;  // reversal: both samples must be >= 40% of threshold

class MouseSmashDetector {
  constructor(onTrigger) {
    this.onTrigger    = onTrigger;
    this._buf         = []; // { vx, vy, speed, t }
    this._lastX       = null;
    this._lastY       = null;
    this._lastTime    = null;
    this._lastTrigger = 0;
  }

  handleMove(x, y) {
    if (!settings.isEnabled('mouseSmash')) return;

    const now = Date.now();

    if (this._lastX !== null) {
      const dt = now - this._lastTime;
      if (dt <= 0) {
        this._lastX = x; this._lastY = y; this._lastTime = now;
        return;
      }

      const vx    = (x - this._lastX) / dt; // px/ms
      const vy    = (y - this._lastY) / dt;
      const speed = Math.sqrt(vx * vx + vy * vy) * 1000; // px/s

      // Prune samples outside the rolling window
      this._buf = this._buf.filter(s => now - s.t <= WINDOW_MS);
      this._buf.push({ vx, vy, speed, t: now });

      const threshold = settings.getThreshold('mouseSmash'); // px/s
      const cooldown  = settings.getCooldown('mouseSmash');
      const peakSpeed = Math.max(...this._buf.map(s => s.speed));

      let triggered = false;

      // ── Test 1: sudden stop (velocity collapse) ──────────────────────────
      if (peakSpeed >= threshold && speed < peakSpeed * DROP_RATIO) {
        triggered = true;
      }

      // ── Test 2: sharp direction reversal ─────────────────────────────────
      if (!triggered && this._buf.length >= 2) {
        const prev    = this._buf[this._buf.length - 2];
        const minSpd  = threshold * MIN_SPEED_RATIO;

        if (prev.speed >= minSpd && speed >= minSpd) {
          const dot     = prev.vx * vx + prev.vy * vy;
          const magProd = (prev.speed / 1000) * (speed / 1000);
          if (magProd > 0 && dot / magProd < REVERSAL_COS) {
            triggered = true;
          }
        }
      }

      if (triggered && now - this._lastTrigger > cooldown) {
        this._lastTrigger = now;
        // Reset rolling window so next smash is measured fresh
        this._buf      = [];
        this._lastX    = null;
        this._lastY    = null;
        this._lastTime = null;
        this.onTrigger('mouseSmash', { peakSpeed: Math.round(peakSpeed), currentSpeed: Math.round(speed) });
        return;
      }
    }

    this._lastX    = x;
    this._lastY    = y;
    this._lastTime = now;
  }

  reset() {
    this._buf      = [];
    this._lastX    = null;
    this._lastY    = null;
    this._lastTime = null;
  }
}

module.exports = MouseSmashDetector;
