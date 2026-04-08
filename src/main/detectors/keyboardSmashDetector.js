'use strict';

const settings = require('../settingsStore');

class KeyboardSmashDetector {
  constructor(onTrigger) {
    this.onTrigger = onTrigger;
    this._timestamps = [];
    this._lastTrigger = 0;
  }

  handleKeyDown() {
    if (!settings.isEnabled('keyboardSmash')) return;

    const now = Date.now();
    const windowMs = settings.getWindowMs('keyboardSmash');

    // Prune events outside the rolling window
    this._timestamps = this._timestamps.filter(t => now - t <= windowMs);
    this._timestamps.push(now);

    const threshold = settings.getThreshold('keyboardSmash');
    if (this._timestamps.length >= threshold) {
      const cooldown = settings.getCooldown('keyboardSmash');
      if (now - this._lastTrigger > cooldown) {
        this._lastTrigger = now;
        const count = this._timestamps.length;
        this._timestamps = []; // reset so next smash is measured fresh
        this.onTrigger('keyboardSmash', { count });
      }
    }
  }
}

module.exports = KeyboardSmashDetector;
