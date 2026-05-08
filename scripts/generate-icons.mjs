import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const buildDir = path.join(root, 'build');
const svgPath = path.join(publicDir, 'finch-logo.svg');
const pngPath = path.join(publicDir, 'finch-logo.png');
const faviconPath = path.join(publicDir, 'favicon.svg');
const iconPngPath = path.join(buildDir, 'icon.png');
const iconIcoPath = path.join(buildDir, 'icon.ico');

await fs.mkdir(publicDir, { recursive: true });
await fs.mkdir(buildDir, { recursive: true });

await sharp(pngPath)
  .resize(256, 256, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .png()
  .toFile(iconPngPath);

const ico = await pngToIco([iconPngPath]);
await fs.writeFile(iconIcoPath, ico);

await fs.copyFile(svgPath, faviconPath);

console.log(`Using ${path.relative(root, pngPath)}`);
console.log(`Generated ${path.relative(root, iconIcoPath)}`);
