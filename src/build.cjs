// Builds free/index.html from index.template.html and the 38 menu data.
// Run from anywhere: node lintar-coffee/src/build.cjs
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const menu = require(path.join(root, '..', '38', 'order-menu.json'));

const WA = 'https://wa.me/6282258018999?text=' + encodeURIComponent('Halo Lintar Coffee, saya mau pesan:');
const CATS = [
  ['minuman', 'Minuman'],
  ['makanan', 'Makanan'],
  ['camilan', 'Camilan'],
  ['dessert', 'Dessert'],
];

// Rebrand: the "38" suffix on house dishes becomes "Lintar"; strip ordering-system notes.
const rename = (n) => n.replace(/\b38\b/, 'Lintar').replace(/\s*\(tulis varian di catatan\)/i, '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rb = (p) => 'Rp' + p / 1000 + 'rb';
const items = menu.map((i) => ({ ...i, name: rename(i.name) }));
const price = (id) => rb(menu.find((i) => i.id === id).price);

const tabs = CATS.map(([id, label], n) => {
  const count = items.filter((i) => i.category === label).length;
  return `<button type="button" role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${n === 0}"${n ? ' tabindex="-1"' : ''}>${label} <span>${count}</span></button>`;
}).join('');

const panels = CATS.map(([id, label], n) => {
  const rows = items.filter((i) => i.category === label).map((i) =>
    `<li><span class="item-name">${esc(i.name)}</span><span class="dots" aria-hidden="true"></span><span class="item-price">${rb(i.price)}</span></li>`).join('\n          ');
  return `<div class="menu-panel" role="tabpanel" id="panel-${id}" aria-labelledby="tab-${id}"${n ? ' hidden' : ''}>
        <h3 class="panel-title">${label}</h3>
        <ul class="menu-list">
          ${rows}
        </ul>
      </div>`;
}).join('\n      ');

const marqueeNames = ['Kopi Susu Samaran', 'Pandan Creamy Latte', 'Katsu Sambal Matah', 'Creamy Matcha', 'Churros', 'Kopi Susu Tipan', 'Ramen Lintar', 'Tubruk Aren'];
const marqueeOnce = marqueeNames.map((n) => `<span>${n}</span><i>✦</i>`).join('');

const vars = {
  WA: WA.replace(/&/g, '&amp;'),
  COUNT: String(items.length),
  N_MAKANAN: String(items.filter((i) => i.category === 'Makanan').length),
  TABS: tabs,
  PANELS: panels,
  MARQUEE: marqueeOnce + marqueeOnce,
  P_SAMARAN: price('samaran'),
  P_TIPAN: price('tipan'),
  P_MAYO: price('katsu-mayo'),
  P_BP: price('katsu-blackpepper'),
  P_SPICY: price('katsu-spicy'),
  P_MATAH: price('katsu-sambal-matah'),
};

let html = fs.readFileSync(path.join(__dirname, 'index.template.html'), 'utf8');
html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => {
  if (!(k in vars)) throw new Error('Missing template value ' + k);
  return vars[k];
});
fs.writeFileSync(path.join(root, 'free', 'index.html'), html);
console.log(`Built free/index.html with ${items.length} items`);
