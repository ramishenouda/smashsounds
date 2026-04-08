'use strict';

const { uIOhook } = require('uiohook-napi');
const MouseSpeedDetector    = require('./detectors/mouseSpeedDetector');
const MouseSmashDetector    = require('./detectors/mouseSmashDetector');
const KeyboardSmashDetector = require('./detectors/keyboardSmashDetector');
const ClickSpamDetector     = require('./detectors/clickSpamDetector');

let onTriggerCallback = null;
const _heldKeys = new Set();

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

  uIOhook.on('mousedown', (e) => {
    clickDetector.handleClick();
    smashDetector.handleMouseDown(e.button);
  });

  uIOhook.on('mouseup', (e) => {
    smashDetector.handleMouseUp(e.button);
  });

  uIOhook.on('keydown', (e) => {
    if (_heldKeys.has(e.keycode)) return; // ignore key-repeat while held
    _heldKeys.add(e.keycode);
    kbDetector.handleKeyDown();
    smashDetector.handleKeyDown(e.keycode);
  });

  uIOhook.on('keyup', (e) => {
    _heldKeys.delete(e.keycode);
    smashDetector.handleKeyUp(e.keycode);
  });

  uIOhook.start();
}

function stop() {
  uIOhook.stop();
}

module.exports = { start, stop };
