/**
 * generate-icon.js
 * Generates a simple 256×256 PNG icon for SmashMoans using pure Node.js.
 * Run once with: node scripts/generate-icon.js
 */

'use strict';

const fs   = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const OUT_DIR = path.join(__dirname, '../assets/icons');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SIZE = 256;

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) {
    crc ^= b;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const crcInput  = Buffer.concat([typeBytes, data]);
  const crcVal    = crc32(crcInput);
  const out       = Buffer.allocUnsafe(4 + 4 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  typeBytes.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crcVal, 8 + data.length);
  return out;
}

function writePng(filePath, rgba, width, height) {
  const scanlines = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.allocUnsafe(1 + width * 4);
    row[0] = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      row[1 + x * 4 + 0] = rgba[i];
      row[1 + x * 4 + 1] = rgba[i + 1];
      row[1 + x * 4 + 2] = rgba[i + 2];
      row[1 + x * 4 + 3] = rgba[i + 3];
    }
    scanlines.push(row);
  }

  const raw        = Buffer.concat(scanlines);
  const compressed = zlib.deflateSync(raw, { level: 6 });

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width,  0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);

  fs.writeFileSync(filePath, png);
  console.log(`  ✓ ${path.basename(filePath)}`);
}

const rgba = new Uint8Array(SIZE * SIZE * 4);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = a;
}

function fillCircle(cx, cy, radius, r, g, b, a = 255) {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= radius * radius) setPixel(x, y, r, g, b, a);
    }
  }
}

function fillRect(x0, y0, w, h, r, g, b, a = 255) {
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++)
      setPixel(x, y, r, g, b, a);
}

// Background gradient
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const t = y / SIZE;
    setPixel(x, y, Math.round(26 * (1 - t) + 15 * t), Math.round(26 * (1 - t) + 33 * t), Math.round(46 * (1 - t) + 64 * t));
  }
}

const PAD = 20;
fillRect(PAD, PAD, SIZE - PAD * 2, SIZE - PAD * 2, 15, 33, 64);
for (const [cx, cy] of [[PAD, PAD], [SIZE - PAD, PAD], [PAD, SIZE - PAD], [SIZE - PAD, SIZE - PAD]]) {
  fillCircle(cx, cy, PAD, 15, 33, 64);
}

fillCircle(SIZE / 2, SIZE / 2, 70, 233, 69, 96);

const MX = SIZE / 2;
const MY = SIZE / 2;
fillRect(MX - 10, MY - 50, 20, 60, 255, 255, 255);
fillCircle(MX, MY + 30, 12, 255, 255, 255);

console.log('Generating icons…');
writePng(path.join(OUT_DIR, 'icon.png'), rgba, SIZE, SIZE);
fs.copyFileSync(path.join(OUT_DIR, 'icon.png'), path.join(OUT_DIR, 'tray.png'));
console.log('  ✓ tray.png (copy)');
console.log('Done. Files written to assets/icons/');
