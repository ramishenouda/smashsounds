'use strict';

// electron-store v11+ is ESM-first; the constructor is exported as `.default`
const Store = require('electron-store').default ?? require('electron-store');

const schema = {
  background: {
    type: 'object',
    properties: {
      imagePath: { type: ['string', 'null'], default: 'assets/bg.png' },
      opacity:   { type: 'number', default: 0.6 },
      blur:      { type: 'number', default: 0 },
      fit:       { type: 'string', default: 'contain' }
    },
    default: {}
  },
  triggers: {
    type: 'object',
    properties: {
      mouseSpeed: {
        type: 'object',
        properties: {
          enabled:   { type: 'boolean', default: true },
          threshold: { type: 'number',  default: 10000 },
          cooldown:  { type: 'number',  default: 2500 },
          volume:    { type: 'number',  default: 1.0 },
          duration:  { type: 'number',  default: 0 },
          soundPath: { type: ['string', 'null'], default: null }
        },
        default: {}
      },
      mouseSmash: {
        type: 'object',
        properties: {
          enabled:   { type: 'boolean', default: true },
          threshold: { type: 'number',  default: 3 },
          cooldown:  { type: 'number',  default: 2000 },
          volume:    { type: 'number',  default: 1.0 },
          duration:  { type: 'number',  default: 0 },
          soundPath: { type: ['string', 'null'], default: null }
        },
        default: {}
      },
      keyboardSmash: {
        type: 'object',
        properties: {
          enabled:   { type: 'boolean', default: true },
          threshold: { type: 'number',  default: 6 },
          windowMs:  { type: 'number',  default: 500 },
          cooldown:  { type: 'number',  default: 500 },
          volume:    { type: 'number',  default: 1.0 },
          duration:  { type: 'number',  default: 0 },
          soundPath: { type: ['string', 'null'], default: null }
        },
        default: {}
      },
      clickSpam: {
        type: 'object',
        properties: {
          enabled:   { type: 'boolean', default: true },
          threshold: { type: 'number',  default: 5 },
          windowMs:  { type: 'number',  default: 1000 },
          cooldown:  { type: 'number',  default: 500 },
          volume:    { type: 'number',  default: 1.0 },
          duration:  { type: 'number',  default: 0 },
          soundPath: { type: ['string', 'null'], default: null }
        },
        default: {}
      }
    },
    default: {}
  }
};

const store = new Store({ schema });

// Repair incorrectly persisted mouseSmash threshold (was defaulting to 2500 instead of 3)
{
  const t = store.get('triggers.mouseSmash.threshold');
  if (typeof t === 'number' && t > 6) {
    store.set('triggers.mouseSmash.threshold', 3);
  }
}

function getBackground() {
  return store.get('background');
}

function saveBackground(bg) {
  store.set('background', bg);
}

function getSettings() {
  return store.get('triggers');
}

function saveSettings(triggers) {
  store.set('triggers', triggers);
}

function getSoundPath(triggerId) {
  return store.get(`triggers.${triggerId}.soundPath`, null);
}

function isEnabled(triggerId) {
  return store.get(`triggers.${triggerId}.enabled`, true);
}

function getThreshold(triggerId) {
  return store.get(`triggers.${triggerId}.threshold`);
}

function getWindowMs(triggerId) {
  return store.get(`triggers.${triggerId}.windowMs`);
}

function getCooldown(triggerId) {
  return store.get(`triggers.${triggerId}.cooldown`, 500);
}

module.exports = {
  getBackground,
  saveBackground,
  getSettings,
  saveSettings,
  getSoundPath,
  isEnabled,
  getThreshold,
  getWindowMs,
  getCooldown
};
