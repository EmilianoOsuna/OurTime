import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcIcon = join(__dirname, '../public/logo.png');
const publicDir = join(__dirname, '../public');

const icons = [
  { name: 'favicon.png', size: 64 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

// Maskable version needs padding (safe zone = center 80% of image)
const maskableSize = 512;
const iconSize = Math.round(maskableSize * 0.75); // 75% of canvas = safe zone

console.log('Generating PWA icons from logo.png...');

for (const icon of icons) {
  const outPath = join(publicDir, icon.name);
  await sharp(srcIcon)
    .resize(icon.size, icon.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(outPath);
  console.log(`✅ ${icon.name} (${icon.size}x${icon.size})`);
}

// Maskable: logo centered on white background with padding
const maskablePath = join(publicDir, 'pwa-maskable-512x512.png');
await sharp({
  create: {
    width: maskableSize,
    height: maskableSize,
    channels: 4,
    background: { r: 255, g: 255, b: 255, alpha: 255 }
  }
})
  .composite([{
    input: await sharp(srcIcon).resize(iconSize, iconSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer(),
    gravity: 'center'
  }])
  .png()
  .toFile(maskablePath);

console.log(`✅ pwa-maskable-512x512.png (with safe-zone padding)`);
console.log('\n🎉 All icons generated from your logo!');
