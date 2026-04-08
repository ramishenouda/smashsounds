'use strict';

const settings = require('../settingsStore');

class ClickSpamDetector {
  constructor(onTrigger) {
    this.onTrigger = onTrigger;
    this._timestamps = [];
    this._lastTrigger = 0;
  }

  handleClick() {
    if (!settings.isEnabled('clickSpam')) return;

    const now = Date.now();
    const windowMs = settings.getWindowMs('clickSpam');

    // Prune events outside the rolling window
    this._timestamps = this._timestamps.filter(t => now - t <= windowMs);
    this._timestamps.push(now);

    const threshold = settings.getThreshold('clickSpam');
    if (this._timestamps.length >= threshold) {
      const cooldown = settings.getCooldown('clickSpam');
      if (now - this._lastTrigger > cooldown) {
        this._lastTrigger = now;
        const count = this._timestamps.length;
        this._timestamps = []; // reset so next spam is measured fresh
        this.onTrigger('clickSpam', { count });
      }
    }
  }
}

module.exports = ClickSpamDetector;
