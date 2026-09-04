import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Clean white-on-transparent silhouette SVG specifically engineered for Android notification & monochrome icon standards (48x48)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
  <!-- Left Book Page -->
  <path d="M6 35.5C11.5 34.2 17.5 33.8 22 36.5V13.5C17.5 10.8 11.5 11.2 6 12.5V35.5Z" fill="#FFFFFF"/>
  <!-- Right Book Page -->
  <path d="M42 35.5C36.5 34.2 30.5 33.8 26 36.5V13.5C30.5 10.8 36.5 11.2 42 12.5V35.5Z" fill="#FFFFFF"/>
  <!-- Center Ribbon Bookmark -->
  <path d="M22 13V27.5L24 25.5L26 27.5V13H22Z" fill="#FFFFFF"/>
  <!-- Story Arc Arc Star / Point -->
  <circle cx="36" cy="18" r="2" fill="#FFFFFF"/>
  <path d="M12 21C16 16.5 28 15.5 33 17.5" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2 3"/>
</svg>`;

const publicDir = path.resolve(process.cwd(), 'public');

// Write SVG file
fs.writeFileSync(path.join(publicDir, 'icon-monochrome-48.svg'), svgContent, 'utf-8');
console.log('Saved /public/icon-monochrome-48.svg');

// Render 48x48 PNG with transparent background using sharp
await sharp(Buffer.from(svgContent))
  .resize(48, 48)
  .png()
  .toFile(path.join(publicDir, 'icon-monochrome-48.png'));

console.log('Saved /public/icon-monochrome-48.png (48x48 px)');
