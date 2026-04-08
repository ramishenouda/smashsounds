/**
 * generate-sounds.js
 * Generates 4 simple default WAV sound files.
 * Run once with: node scripts/generate-sounds.js
 */

'use strict';

const fs   = require('node:fs');
const path = require('node:path');

const OUT_DIR = path.join(__dirname, '../assets/sounds');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SAMPLE_RATE = 44100;

function writeWav(filePath, samples, sampleRate = SAMPLE_RATE) {
  const numSamples = samples.length;
  const byteCount  = numSamples * 2;
  const buffer     = Buffer.allocUnsafe(44 + byteCount);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + byteCount, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16,         16);
  buffer.writeUInt16LE(1,          20);
  buffer.writeUInt16LE(1,          22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2,          32);
  buffer.writeUInt16LE(16,         34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(byteCount,  40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
  console.log(`  ✓ ${path.basename(filePath)}`);
}

function envelope(samples, attackSamples, decaySamples) {
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    let env = 1;
    if (i < attackSamples) env = i / attackSamples;
    const fromEnd = samples.length - i;
    if (fromEnd < decaySamples) env *= fromEnd / decaySamples;
    out[i] = samples[i] * env;
  }
  return out;
}

function sine(freq, durationSec, volume = 0.8) {
  const len = Math.floor(durationSec * SAMPLE_RATE);
  const s   = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    s[i] = volume * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
  }
  return s;
}

function noise(durationSec, volume = 0.5) {
  const len = Math.floor(durationSec * SAMPLE_RATE);
  const s   = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    s[i] = volume * (Math.random() * 2 - 1);
  }
  return s;
}

function mix(...arrays) {
  const len = arrays[0].length;
  const out = new Float32Array(len);
  for (const a of arrays) {
    for (let i = 0; i < Math.min(len, a.length); i++) out[i] += a[i];
  }
  return out;
}

function sweep(f0, f1, durationSec, volume = 0.7) {
  const len = Math.floor(durationSec * SAMPLE_RATE);
  const s   = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t    = i / len;
    const freq = f0 + (f1 - f0) * t;
    phase += 2 * Math.PI * freq / SAMPLE_RATE;
    s[i] = volume * Math.sin(phase);
  }
  return s;
}

console.log('Generating default sounds…');

// 1. Mouse Speed: rising whoosh
{
  const w   = sweep(200, 1200, 0.25, 0.65);
  const out = envelope(w, SAMPLE_RATE * 0.02, SAMPLE_RATE * 0.12);
  writeWav(path.join(OUT_DIR, 'mouse-speed.wav'), out);
}

// 2. Mouse Smash: deep thud + noise burst
{
  const thud = sine(80, 0.3, 0.8);
  const n    = noise(0.1, 0.4);
  const both = mix(
    envelope(thud, SAMPLE_RATE * 0.005, SAMPLE_RATE * 0.15),
    envelope(n,    SAMPLE_RATE * 0.002, SAMPLE_RATE * 0.06)
  );
  writeWav(path.join(OUT_DIR, 'mouse-smash.wav'), both);
}

// 3. Keyboard Smash: rapid descending blips
{
  const len   = Math.floor(0.3 * SAMPLE_RATE);
  const out   = new Float32Array(len);
  const freqs = [880, 740, 660, 550, 440];
  for (let b = 0; b < freqs.length; b++) {
    const start   = Math.floor((b / freqs.length) * len);
    const blipLen = Math.floor(0.04 * SAMPLE_RATE);
    for (let i = 0; i < blipLen && (start + i) < len; i++) {
      const env = i < blipLen / 2 ? (i / (blipLen / 2)) : (1 - (i - blipLen / 2) / (blipLen / 2));
      out[start + i] += 0.5 * env * Math.sin(2 * Math.PI * freqs[b] * i / SAMPLE_RATE);
    }
  }
  writeWav(path.join(OUT_DIR, 'keyboard-smash.wav'), out);
}

// 4. Click Spam: short neutral tick
{
  const tick = sine(1200, 0.06, 0.9);
  const out  = envelope(tick, SAMPLE_RATE * 0.002, SAMPLE_RATE * 0.04);
  writeWav(path.join(OUT_DIR, 'click-spam.wav'), out);
}

console.log('Done. Files written to assets/sounds/');
