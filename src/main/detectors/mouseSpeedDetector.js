'use strict';

const settings = require('../settingsStore');

class MouseSpeedDetector {
  constructor(onTrigger) {
    this.onTrigger = onTrigger;
    this._lastX = null;
    this._lastY = null;
    this._lastTime = null;
    this._lastTrigger = 0;
  }

  handleMove(x, y) {
    if (!settings.isEnabled('mouseSpeed')) return;

    const now = Date.now();

    if (this._lastX !== null) {
      const dt = now - this._lastTime;
      if (dt > 0) {
        const dx = x - this._lastX;
        const dy = y - this._lastY;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt; // px/ms

        if (speed * 1000 > settings.getThreshold('mouseSpeed')) {
          const cooldown = settings.getCooldown('mouseSpeed');
          if (now - this._lastTrigger > cooldown) {
            this._lastTrigger = now;
            // Reset state so next burst is measured fresh
            this._lastX = null;
            this._lastY = null;
            this._lastTime = null;
            this.onTrigger('mouseSpeed', { speed: Math.round(speed * 1000) });
            return;
          }
        }
      }
    }

    this._lastX = x;
    this._lastY = y;
    this._lastTime = now;
  }

  reset() {
    this._lastX = null;
    this._lastY = null;
    this._lastTime = null;
  }
}

module.exports = MouseSpeedDetector;
