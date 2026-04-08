'use strict';

const { uIOhook } = require('uiohook-napi');
const MouseSpeedDetector    = require('./detectors/mouseSpeedDetector');
const MouseSmashDetector    = require('./detectors/mouseSmashDetector');
const KeyboardSmashDetector = require('./detectors/keyboardSmashDetector');
const ClickSpamDetector     = require('./detectors/clickSpamDetector');

let onTriggerCallback = null;

function dispatchTrigger(triggerId, data) {
  if (onTriggerCallback) {
    onTriggerCallback(triggerId, data);
  }
}

const speedDetector    = new MouseSpeedDetector(dispatchTrigger);
const smashDetector    = new MouseSmashDetector(dispatchTrigger);
const kbDetector       = new KeyboardSmashDetector(dispatchTrigger);
const clickDetector    = new ClickSpamDetector(dispatchTrigger);

function start(triggerCallback) {
  onTriggerCallback = triggerCallback;

  uIOhook.on('mousemove', (e) => {
    speedDetector.handleMove(e.x, e.y);
    smashDetector.handleMove(e.x, e.y);
  });

  uIOhook.on('mousedown', () => {
    clickDetector.handleClick();
  });

  uIOhook.on('keydown', () => {
    kbDetector.handleKeyDown();
  });

  uIOhook.start();
}

function stop() {
  uIOhook.stop();
}

module.exports = { start, stop };
