#!/usr/bin/env node
/**
 * generate-pwa-icons.js
 * Generates PWA PNG icons from apps/web/app/icon.svg using sharp.
 * Run from repo root: node scripts/generate-pwa-icons.js
 */

const path = require('path');
const fs = require('fs');

async function main() {
  // sharp must be loaded dynamically — it's installed in apps/web node_modules
  let sharp;
  try {
    sharp = require(path.join(__dirname, '../apps/web/node_modules/sharp'));
  } catch {
    // fallback: global or hoisted
    sharp = require('sharp');
  }

  const srcSvg = path.join(__dirname, '../apps/web/app/icon.svg');
  const outDir = path.join(__dirname, '../apps/web/public');

  if (!fs.existsSync(srcSvg)) {
    console.error('ERROR: icon.svg not found at', srcSvg);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const icons = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const { name, size } of icons) {
    const outPath = path.join(outDir, name);
    await sharp(srcSvg)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${outPath} (${size}x${size})`);
  }

  console.log('Done — all PWA icons generated.');
}

main().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
