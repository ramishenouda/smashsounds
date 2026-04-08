'use strict';

// electron-store v11+ is ESM-first; the constructor is exported as `.default`
const Store = require('electron-store').default ?? require('electron-store');

const schema = {
  triggers: {
    type: 'object',
    properties: {
      mouseSpeed: {
        type: 'object',
        properties: {
          enabled:   { type: 'boolean', default: true },
          threshold: { type: 'number',  default: 1500 },
          cooldown:  { type: 'number',  default: 500 },
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
          threshold: { type: 'number',  default: 600 },
          cooldown:  { type: 'number',  default: 500 },
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
  getSettings,
  saveSettings,
  getSoundPath,
  isEnabled,
  getThreshold,
  getWindowMs,
  getCooldown
};
