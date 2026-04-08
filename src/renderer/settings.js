'use strict';

const TRIGGER_META = {
  mouseSpeed: {
    label: 'SPEEDY GONZALES',
    icon: '💨',
    description: 'You move that mouse like it owes you money 🏃',
    thresholdLabel: 'Speed threshold (px/s)',
    thresholdMin: 200,
    thresholdMax: 15000,
    thresholdStep: 200,
    thresholdDefault: 10000,
    hasWindow: false
  },
  mouseSmash: {
    label: 'DESK DESTROYER',
    icon: '💀',
    description: '3+ keys at once ⌨️ · or left+right click together 🖱️',
    thresholdLabel: 'Keys required (simultaneous)',
    thresholdMin: 2,
    thresholdMax: 6,
    thresholdStep: 1,
    thresholdDefault: 3,
    hasWindow: false
  },
  keyboardSmash: {
    label: 'KEYBOARD FUNERAL',
    icon: '⚰️',
    description: 'RIP keyboard. You mashed it like a gremlin. 💢',
    thresholdLabel: 'Key count threshold',
    thresholdMin: 2,
    thresholdMax: 20,
    thresholdStep: 1,
    thresholdDefault: 10,
    windowLabel: 'Window (ms)',
    windowMin: 100,
    windowMax: 2000,
    windowStep: 50,
    windowDefault: 500,
    hasWindow: true
  },
  clickSpam: {
    label: 'CLICK PSYCHO',
    icon: '🤡',
    description: 'Clicking like a maniac. Seek help. We\u2019re proud of you. 🖱️💥',
    thresholdLabel: 'Click count threshold',
    thresholdMin: 2,
    thresholdMax: 15,
    thresholdStep: 1,
    thresholdDefault: 5,
    windowLabel: 'Window (ms)',
    windowMin: 100,
    windowMax: 3000,
    windowStep: 50,
    windowDefault: 1000,
    hasWindow: true
  }
};

let settings = {};

function buildCard(triggerId, meta, cfg) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.trigger = triggerId;

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">
        <span class="card-icon">${meta.icon}</span>
        <span>${meta.label}</span>
        <span class="card-chevron">▼</span>
      </div>
      <label class="toggle" onclick="event.stopPropagation()">
        <input type="checkbox" class="toggle-input" id="enabled-${triggerId}" ${cfg.enabled ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    </div>

    <div class="card-body">
      <p class="card-desc">${meta.description}</p>

      <div class="card-divider"></div>
      <div class="section-label">⚙ Detection</div>

      <div class="field-group">
        <label class="field-label" for="threshold-${triggerId}">
          ${meta.thresholdLabel}
          <span class="field-value" id="threshold-val-${triggerId}">${cfg.threshold ?? meta.thresholdDefault}</span>
        </label>
        <input type="range" class="slider" id="threshold-${triggerId}"
          min="${meta.thresholdMin}" max="${meta.thresholdMax}" step="${meta.thresholdStep}"
          value="${cfg.threshold ?? meta.thresholdDefault}">
      </div>

      ${meta.hasWindow ? `
      <div class="field-group">
        <label class="field-label" for="window-${triggerId}">
          ${meta.windowLabel}
          <span class="field-value" id="window-val-${triggerId}">${cfg.windowMs ?? meta.windowDefault}</span>
        </label>
        <input type="range" class="slider" id="window-${triggerId}"
          min="${meta.windowMin}" max="${meta.windowMax}" step="${meta.windowStep}"
          value="${cfg.windowMs ?? meta.windowDefault}">
      </div>` : ''}

      <div class="field-group">
        <label class="field-label">Cooldown (ms)
          <span class="field-value" id="cooldown-val-${triggerId}">${cfg.cooldown ?? 500}</span>
        </label>
        <input type="range" class="slider" id="cooldown-${triggerId}"
          min="100" max="3000" step="50"
          value="${cfg.cooldown ?? 500}">
      </div>

      <div class="card-divider"></div>
      <div class="section-label">🔊 Sound</div>

      <div class="field-group">
        <label class="field-label" for="volume-${triggerId}">
          Volume
          <span class="field-value" id="volume-val-${triggerId}">${Math.round((cfg.volume ?? 1) * 100)}%</span>
        </label>
        <input type="range" class="slider slider-volume" id="volume-${triggerId}"
          min="0" max="100" step="1"
          value="${Math.round((cfg.volume ?? 1) * 100)}">
      </div>

      <div class="field-group">
        <label class="field-label" for="duration-${triggerId}">
          Play duration
          <span class="field-value" id="duration-val-${triggerId}">${(cfg.duration ?? 0) === 0 ? 'Full' : (cfg.duration ?? 0) + ' ms'}</span>
        </label>
        <input type="range" class="slider" id="duration-${triggerId}"
          min="0" max="5000" step="100"
          value="${cfg.duration ?? 0}">
      </div>

    <div class="sound-row">
      <span class="sound-name" id="sound-name-${triggerId}">${cfg.soundPath ? cfg.soundPath.split(/[\\/]/).pop() : 'Default sound'}</span>
      <div class="sound-buttons">
        <button class="btn btn-secondary btn-browse" data-trigger="${triggerId}">Browse…</button>
        <button class="btn btn-secondary btn-reset" data-trigger="${triggerId}">Reset</button>
        <button class="btn btn-accent btn-preview" data-trigger="${triggerId}">▶ Play</button>
      </div>

      <div class="activity-bar-wrap">
        <div class="activity-bar" id="activity-${triggerId}"></div>
      </div>
    </div>
  `;

  // Wire header click to toggle collapse
  card.querySelector('.card-header').addEventListener('click', () => {
    card.classList.toggle('open');
  });

  return card;
}

function getCardSettings(triggerId) {
  const meta     = TRIGGER_META[triggerId];
  const enabled  = document.getElementById(`enabled-${triggerId}`).checked;
  const threshold = Number(document.getElementById(`threshold-${triggerId}`).value);
  const cooldown = Number(document.getElementById(`cooldown-${triggerId}`).value);
  const volume   = Number(document.getElementById(`volume-${triggerId}`).value) / 100;
  const duration = Number(document.getElementById(`duration-${triggerId}`).value);
  const entry    = { enabled, threshold, cooldown, volume, duration, soundPath: settings[triggerId]?.soundPath ?? null };

  if (meta.hasWindow) {
    entry.windowMs = Number(document.getElementById(`window-${triggerId}`).value);
  }

  return entry;
}

function collectAllSettings() {
  const out = {};
  for (const id of Object.keys(TRIGGER_META)) {
    out[id] = getCardSettings(id);
  }
  return out;
}

async function persistSettings() {
  const triggers = collectAllSettings();
  settings = triggers;
  await window.electronAPI.saveSettings(triggers);
}

const TRIGGER_EMOJIS = {
  mouseSpeed:    ['💨','🚀','⚡','🏃','💨'],
  mouseSmash:    ['💥','🔨','💀','🤬','😤'],
  keyboardSmash: ['⚰️','🔥','💢','😱','🤯'],
  clickSpam:     ['🤡','😈','🖱️','💦','🎰']
};

function spawnEmoji(triggerId) {
  const card = document.querySelector(`.card[data-trigger="${triggerId}"]`);
  if (!card) return;
  const pool  = TRIGGER_EMOJIS[triggerId] ?? ['💥'];
  const emoji = pool[Math.floor(Math.random() * pool.length)];
  const el    = document.createElement('span');
  el.className = 'emoji-burst';
  el.textContent = emoji;
  const rect = card.getBoundingClientRect();
  el.style.left = (Math.random() * (rect.width - 40) + 20) + 'px';
  el.style.top  = (rect.height / 2 + Math.random() * 20 - 10) + 'px';
  card.style.position = 'relative';
  card.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function flashActivity(triggerId) {
  const bar = document.getElementById(`activity-${triggerId}`);
  if (bar) {
    bar.classList.remove('active');
    void bar.offsetWidth;
    bar.classList.add('active');
  }

  // Screen flash
  document.body.classList.remove('screen-flash');
  void document.body.offsetWidth;
  document.body.classList.add('screen-flash');

  // Card shake
  const card = document.querySelector(`.card[data-trigger="${triggerId}"]`);
  if (card) {
    card.classList.remove('card-shake');
    void card.offsetWidth;
    card.classList.add('card-shake');
  }

  // Emoji burst
  const count = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    setTimeout(() => spawnEmoji(triggerId), i * 60);
  }
}

async function init() {
  settings = await window.electronAPI.getSettings();
  const container = document.getElementById('cards-container');

  for (const [id, meta] of Object.entries(TRIGGER_META)) {
    const cfg  = settings[id] ?? {};
    const card = buildCard(id, meta, cfg);
    container.appendChild(card);

    // Slider live-update labels
    for (const type of ['threshold', 'cooldown', ...(meta.hasWindow ? ['window'] : [])]) {
      const inputEl = document.getElementById(`${type}-${id}`);
      const valEl   = document.getElementById(`${type}-val-${id}`);
      if (!inputEl) continue;
      inputEl.addEventListener('input', () => { valEl.textContent = inputEl.value; });
      inputEl.addEventListener('change', persistSettings);
    }

    // Volume slider — live update label + immediately apply to Howl
    const volInput = document.getElementById(`volume-${id}`);
    const volVal   = document.getElementById(`volume-val-${id}`);
    volInput.addEventListener('input', () => {
      const pct = Number(volInput.value);
      volVal.textContent = `${pct}%`;
      window._soundPlayer.setVolume(id, pct / 100);
    });
    volInput.addEventListener('change', persistSettings);

    // Duration slider — live update label + update player
    const durInput = document.getElementById(`duration-${id}`);
    const durVal   = document.getElementById(`duration-val-${id}`);
    durInput.addEventListener('input', () => {
      const ms = Number(durInput.value);
      durVal.textContent = ms === 0 ? 'Full' : `${ms} ms`;
      window._soundPlayer.setDuration(id, ms);
    });
    durInput.addEventListener('change', persistSettings);

    // Toggle
    document.getElementById(`enabled-${id}`).addEventListener('change', persistSettings);

    // Browse button
    card.querySelector('.btn-browse').addEventListener('click', async () => {
      const p = await window.electronAPI.selectSoundFile(id);
      if (p) {
        settings[id] = settings[id] ?? {};
        settings[id].soundPath = p;
        document.getElementById(`sound-name-${id}`).textContent = p.split(/[\\/]/).pop();
        await persistSettings();
        const vol = Number(document.getElementById(`volume-${id}`).value) / 100;
        await window._soundPlayer.reloadTrigger(id, p, vol);
      }
    });

    // Reset sound
    card.querySelector('.btn-reset').addEventListener('click', async () => {
      settings[id] = settings[id] ?? {};
      settings[id].soundPath = null;
      document.getElementById(`sound-name-${id}`).textContent = 'Default sound';
      await persistSettings();
      const vol = Number(document.getElementById(`volume-${id}`).value) / 100;
      await window._soundPlayer.reloadTrigger(id, null, vol);
    });

    // Preview
    card.querySelector('.btn-preview').addEventListener('click', () => {
      window._soundPlayer.play(id);
    });
  }

  // Load all sounds after UI is built
  await window._soundPlayer.loadAll(settings);

  // ── Background panel ─────────────────────────────────────────────────────
  await initBackground();

  // Listen for trigger events from main process
  window.electronAPI.onTrigger((triggerId, _data) => {
    if (settings[triggerId]?.enabled !== false && !window._soundPlayer.isBusy()) {
      window._soundPlayer.play(triggerId);
      flashActivity(triggerId);
    }
  });
}

// ── Background ────────────────────────────────────────────────────────────────

async function applyBackground(bg) {
  const layer   = document.getElementById('bg-layer');
  const overlay = document.getElementById('bg-overlay');
  const preview = document.getElementById('bg-preview');

  let imagePath = bg?.imagePath ?? null;
  const opacity = bg?.opacity   ?? 0.6;
  const blur    = bg?.blur      ?? 0;
  const fit     = bg?.fit       ?? 'contain';

  // Resolve relative paths (e.g. assets/bg.png) via main process
  if (imagePath && !imagePath.match(/^[A-Za-z]:[\\\/]/) && !imagePath.startsWith('/')) {
    imagePath = await window.electronAPI.resolveAssetPath(imagePath);
  }

  overlay.style.opacity = imagePath ? opacity : 1;

  if (imagePath) {
    const url = `file:///${imagePath.replace(/\\/g, '/')}`;
    layer.style.backgroundImage    = `url("${url}")`;
    layer.style.filter             = blur > 0 ? `blur(${blur}px)` : '';
    layer.style.backgroundPosition = 'center top';
    layer.style.backgroundRepeat   = 'no-repeat';
    if (fit === 'stretch') {
      layer.style.backgroundSize = '100% 100%';
    } else if (fit === 'center') {
      layer.style.backgroundSize = 'auto';
    } else {
      layer.style.backgroundSize = fit; // 'contain' or 'cover'
    }
    preview.innerHTML = `<img src="${url}" alt="bg preview">`;
  } else {
    layer.style.backgroundImage = '';
    layer.style.filter          = '';
    preview.innerHTML = '<span class="bg-preview-placeholder">No background set</span>';
  }
}

async function initBackground() {
  let bg = await window.electronAPI.getBackground();
  bg = bg ?? {};

  // Toggle collapse
  document.getElementById('bg-panel-title').addEventListener('click', () => {
    document.getElementById('bg-panel').classList.toggle('open');
  });

  // Sync UI controls to stored values
  const opacitySlider = document.getElementById('bg-opacity');
  const blurSlider    = document.getElementById('bg-blur');
  const fitSelect     = document.getElementById('bg-fit');
  const opacityVal    = document.getElementById('bg-opacity-val');
  const blurVal       = document.getElementById('bg-blur-val');
  const fitVal        = document.getElementById('bg-fit-val');

  const storedOpacity = Math.round((1 - (bg.opacity ?? 0.25)) * 100); // darkness = 1 - overlay opacity
  opacitySlider.value = storedOpacity;
  opacityVal.textContent = storedOpacity + '%';
  blurSlider.value   = bg.blur ?? 0;
  blurVal.textContent = (bg.blur ?? 0) + 'px';
  fitSelect.value    = bg.fit ?? 'cover';
  fitVal.textContent = fitSelect.options[fitSelect.selectedIndex]?.text ?? 'Cover';

  await applyBackground(bg);

  async function saveBg() {
    bg.opacity = 1 - (Number(opacitySlider.value) / 100);
    bg.blur    = Number(blurSlider.value);
    bg.fit     = fitSelect.value;
    await window.electronAPI.saveBackground(bg);
    await applyBackground(bg);
  }

  opacitySlider.addEventListener('input', () => {
    opacityVal.textContent = opacitySlider.value + '%';
    bg.opacity = 1 - (Number(opacitySlider.value) / 100);
    applyBackground(bg);
  });
  opacitySlider.addEventListener('change', saveBg);

  blurSlider.addEventListener('input', () => {
    blurVal.textContent = blurSlider.value + 'px';
    bg.blur = Number(blurSlider.value);
    applyBackground(bg);
  });
  blurSlider.addEventListener('change', saveBg);

  fitSelect.addEventListener('change', () => {
    fitVal.textContent = fitSelect.options[fitSelect.selectedIndex]?.text ?? '';
    saveBg();
  });

  document.getElementById('bg-browse').addEventListener('click', async () => {
    const p = await window.electronAPI.selectBgImage();
    if (p) {
      bg.imagePath = p;
      await saveBg();
    }
  });

  document.getElementById('bg-clear').addEventListener('click', async () => {
    bg.imagePath = null;
    await saveBg();
  });
}

document.addEventListener('DOMContentLoaded', init);
