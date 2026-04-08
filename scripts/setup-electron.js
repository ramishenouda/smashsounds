/**
 * setup-electron.js
 * Downloads the Electron binary directly from GitHub releases without npm.
 * Run with: node scripts/setup-electron.js
 *
 * Used when `npm install` can't update node_modules/electron due to a file lock.
 * Places the binary in .electron-bin/ at the project root.
 */

'use strict';

const https  = require('node:https');
const fs     = require('node:fs');
const path   = require('node:path');
const zlib   = require('node:zlib');
const { execSync } = require('node:child_process');

const VERSION    = '35.7.5';
const PLATFORM   = 'win32';
const ARCH       = 'x64';
const ZIPNAME    = `electron-v${VERSION}-${PLATFORM}-${ARCH}.zip`;
const RELEASE_URL = `https://github.com/electron/electron/releases/download/v${VERSION}/${ZIPNAME}`;
const OUT_DIR    = path.join(__dirname, '../.electron-bin');
const ZIP_PATH   = path.join(OUT_DIR, ZIPNAME);

fs.mkdirSync(OUT_DIR, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`  Downloading ${path.basename(dest)}…`);
    const file = fs.createWriteStream(dest);
    const follow = (url) => {
      https.get(url, { headers: { 'User-Agent': 'SmashMoans-setup' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          follow(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const total = parseInt(res.headers['content-length'] || '0', 10);
        let received = 0;
        res.on('data', (chunk) => {
          received += chunk.length;
          if (total) {
            process.stdout.write(`  ${Math.round(received / total * 100)}%\r`);
          }
        });
        res.pipe(file);
        file.on('finish', () => { file.close(); console.log('  100% done'); resolve(); });
      }).on('error', reject);
    };
    follow(url);
  });
}

function extractZip(zipPath, destDir) {
  console.log('  Extracting…');
  // Use PowerShell to extract on Windows (no external deps needed)
  execSync(
    `powershell -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${destDir}'"`,
    { stdio: 'inherit' }
  );
  console.log('  Extracted.');
}

async function main() {
  const exePath = path.join(OUT_DIR, 'electron.exe');
  if (fs.existsSync(exePath)) {
    console.log(`Electron binary already present at ${exePath}`);
  } else {
    console.log(`Downloading Electron v${VERSION} for ${PLATFORM}-${ARCH}…`);
    await download(RELEASE_URL, ZIP_PATH);
    extractZip(ZIP_PATH, OUT_DIR);
    fs.unlinkSync(ZIP_PATH); // remove zip after extraction
    console.log(`Done. Binary at: ${exePath}`);
  }

  // Write a wrapper package.json so node_modules/electron/index.js can find it
  const wrapperIndex = path.join(__dirname, '../node_modules/electron/index.js');
  const wrapperPkg   = path.join(__dirname, '../node_modules/electron/package.json');
  const wrapperPath  = path.join(__dirname, '../node_modules/electron/path.txt');
  const relBin       = path.relative(path.join(__dirname, '../node_modules/electron'), exePath).replace(/\\/g, '/');

  fs.mkdirSync(path.dirname(wrapperIndex), { recursive: true });

  fs.writeFileSync(wrapperPath, relBin);

  fs.writeFileSync(wrapperIndex, `'use strict';
const path = require('path');
const pathFile = path.join(__dirname, 'path.txt');
const electronPath = path.join(__dirname, require('fs').readFileSync(pathFile, 'utf8').trim());
module.exports = electronPath;
`);

  // Only write package.json if it doesn't already exist
  if (!fs.existsSync(wrapperPkg)) {
    fs.writeFileSync(wrapperPkg, JSON.stringify({
      name: 'electron',
      version: VERSION,
      description: 'Build cross platform desktop apps with JavaScript, HTML, and CSS',
      main: 'index.js',
      license: 'MIT'
    }, null, 2));
  }

  // Create .bin/electron.cmd shim
  const binDir  = path.join(__dirname, '../node_modules/.bin');
  const binCmd  = path.join(binDir, 'electron.cmd');
  const binSh   = path.join(binDir, 'electron');
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(binCmd, `@ECHO off\n"${exePath}" %*\r\n`);
  fs.writeFileSync(binSh, `#!/bin/sh\n"${exePath}" "$@"\n`);

  console.log('\nSetup complete. Run: npm start');
}

main().catch(err => { console.error(err); process.exit(1); });
