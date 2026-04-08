'use strict';

// Bundled default sound paths (resolved to absolute by main process on first load)
const DEFAULT_SOUNDS = {
  mouseSpeed:    'assets/sounds/mouse-speed.wav',
  mouseSmash:    'assets/sounds/mouse-smash.wav',
  keyboardSmash: 'assets/sounds/keyboard-smash.wav',
  clickSpam:     'assets/sounds/click-spam.wav'
};

// Active Howl instances keyed by triggerId
const _sounds = {};
// Duration limits in ms per triggerId (0 = play full length)
const _durations = {};
// Pending stop-timers keyed by triggerId
const _stopTimers = {};

async function _resolvePath(p) {
  if (!p) return null;
  // Absolute paths are already usable as a URL in the renderer
  if (p.match(/^[A-Za-z]:\\/) || p.startsWith('/')) {
    return `file:///${p.replace(/\\/g, '/')}`;
  }
  // Relative asset path: ask main to resolve it
  const abs = await window.electronAPI.resolveAssetPath(p);
  return `file:///${abs.replace(/\\/g, '/')}`;
}

async function load(triggerId, customPath, volume = 1) {
  const rawPath = customPath || DEFAULT_SOUNDS[triggerId];
  const url = await _resolvePath(rawPath);
  if (!url) return;

  return new Promise((resolve) => {
    const howl = new Howl({
      src: [url],
      html5: false,  // use Web Audio for low latency
      preload: true,
      volume: Math.max(0, Math.min(1, volume)),
      onload: () => resolve(howl),
      onloaderror: (_id, err) => {
        console.warn(`[SmashMoans] Failed to load sound for ${triggerId}: ${err}`);
        resolve(null);
      }
    });
    _sounds[triggerId] = howl;
  });
}

async function loadAll(settings) {
  const ids = ['mouseSpeed', 'mouseSmash', 'keyboardSmash', 'clickSpam'];
  await Promise.all(ids.map(id => {
    _durations[id] = settings[id]?.duration ?? 0;
    return load(id, settings[id]?.soundPath, settings[id]?.volume ?? 1);
  }));
}

function play(triggerId) {
  const howl = _sounds[triggerId];
  if (!howl) return;

  // Clear any pending stop timer for this trigger
  if (_stopTimers[triggerId]) {
    clearTimeout(_stopTimers[triggerId]);
    delete _stopTimers[triggerId];
  }

  howl.stop();
  howl.play();

  const duration = _durations[triggerId] ?? 0;
  if (duration > 0) {
    _stopTimers[triggerId] = setTimeout(() => {
      howl.stop();
      delete _stopTimers[triggerId];
    }, duration);
  }
}

async function reloadTrigger(triggerId, soundPath, volume) {
  const vol = volume ?? _sounds[triggerId]?.volume() ?? 1;
  if (_sounds[triggerId]) {
    _sounds[triggerId].unload();
    delete _sounds[triggerId];
  }
  await load(triggerId, soundPath, vol);
}

function setVolume(triggerId, volume) {
  const howl = _sounds[triggerId];
  if (!howl) return;
  howl.volume(Math.max(0, Math.min(1, volume)));
}

function setDuration(triggerId, durationMs) {
  _durations[triggerId] = durationMs;
}

window._soundPlayer = { loadAll, play, reloadTrigger, setVolume, setDuration };
