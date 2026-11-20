// Converts Codex's rebranded PNGs in free/assets/raw/ to web-size WebP + OG image.
const path = require('path'); const fs = require('fs');
const sharp = require(path.join(__dirname, '..', '..', '38', '.tools', 'node_modules', 'sharp'));
const A = path.join(__dirname, '..', 'free', 'assets'); const R = path.join(A, 'raw');
const jobs = [
  ['hero.png', [['hero-1600.webp', 1600, 900], ['hero-900.webp', 900, 1000]]],
  ['cans.png', [['cans.webp', 1400, 875]]],
  ['indoor.png', [['indoor.webp', 900, 900]]],
  ['outdoor.png', [['outdoor.webp', 800, 800]]],
  ['samaran.png', [['samaran.webp', 400, 400]]],
  ['tipan.png', [['tipan.webp', 400, 400]]],
];
(async () => {
  for (const [src, outs] of jobs) {
    const f = path.join(R, src);
    if (!fs.existsSync(f)) { console.log('missing', src); continue; }
    for (const [name, w, h] of outs) {
      const pos = name === 'hero-900.webp' ? 'attention' : 'centre';
      await sharp(f).resize(w, h, { fit: 'cover', position: pos }).webp({ quality: 74 }).toFile(path.join(A, name));
      console.log(name, Math.round(fs.statSync(path.join(A, name)).size / 1024) + 'KB');
    }
  }
  if (fs.existsSync(path.join(R, 'hero.png'))) {
    const logo = await sharp(path.join(A, 'logo-wordmark-light.svg'), { density: 200 }).resize(520).png().toBuffer();
    await sharp(path.join(R, 'hero.png')).resize(1200, 630, { fit: 'cover' })
      .composite([{ input: Buffer.from('<svg width="1200" height="630"><rect width="1200" height="630" fill="#1E1410" fill-opacity="0.35"/></svg>') }, { input: logo, left: 60, top: 470 }])
      .jpeg({ quality: 80 }).toFile(path.join(A, 'og-image.jpg'));
    console.log('og-image.jpg');
  }
})();
