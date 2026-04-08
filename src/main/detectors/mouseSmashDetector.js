'use strict';

const settings = require('../settingsStore');

/**
 * Desk Destroyer - fires on either of these conditions:
 *  1. MULTI-KEY: N or more keys pressed within KEYS_WINDOW_MS of each other.
 *  2. DUAL CLICK: left + right mouse buttons both down within DUAL_CLICK_MS.
 */

const KEYS_WINDOW_MS = 150;
const DUAL_CLICK_MS  = 200;

class MouseSmashDetector {
  constructor(onTrigger) {
    this.onTrigger    = onTrigger;
    this._heldKeys    = new Map();
    this._leftDown    = 0;
    this._rightDown   = 0;
    this._lastTrigger = 0;
  }

  handleMove(_x, _y) {}

  handleKeyDown(keycode) {
    if (!settings.isEnabled('mouseSmash')) return;
    const now      = Date.now();
    this._heldKeys.set(keycode, now);
    const required     = settings.getThreshold('mouseSmash') ?? 3;
    const simultaneous = [...this._heldKeys.values()].filter(t => now - t <= KEYS_WINDOW_MS);
    if (simultaneous.length >= required) {
      this._fire({ reason: 'multikey', count: simultaneous.length });
    }
  }

  handleKeyUp(keycode) {
    this._heldKeys.delete(keycode);
  }

  handleMouseDown(button) {
    if (!settings.isEnabled('mouseSmash')) return;
    const now = Date.now();
    if (button === 1) this._leftDown  = now;
    if (button === 2) this._rightDown = now;
    if (this._leftDown && this._rightDown &&
        Math.abs(this._leftDown - this._rightDown) <= DUAL_CLICK_MS) {
      this._fire({ reason: 'dualclick' });
    }
  }

  handleMouseUp(button) {
    if (button === 1) this._leftDown  = 0;
    if (button === 2) this._rightDown = 0;
  }

  _fire(data) {
    const now      = Date.now();
    const cooldown = settings.getCooldown('mouseSmash');
    if (now - this._lastTrigger <= cooldown) return;
    this._lastTrigger = now;
    this._heldKeys.clear();
    this._leftDown  = 0;
    this._rightDown = 0;
    this.onTrigger('mouseSmash', data);
  }

  reset() {
    this._heldKeys.clear();
    this._leftDown  = 0;
    this._rightDown = 0;
  }
}

module.exports = MouseSmashDetector;
