// Standalone export utility. Product routes and billing state are not touched.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { DailyBonusWelcome } from '../../src/DailyBonusWelcome.jsx';
import { DailyBonusNotice } from '../../src/DailyBonusNotice.jsx';
import welcomeCss from '../../src/daily-bonus-welcome.css?raw';
import noticeCss from '../../src/daily-bonus-notice.css?raw';
import font400 from '@fontsource/inter/400.css?raw';
import font500 from '@fontsource/inter/500.css?raw';
import font600 from '@fontsource/inter/600.css?raw';
import font700 from '@fontsource/inter/700.css?raw';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

const baseCss = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, Arial, sans-serif; font-synthesis: none; }
  button { font: inherit; }
  .daily-bonus-welcome, .daily-bonus-notice {
    position: relative !important; top: auto !important; left: auto !important;
    margin: 0 !important; max-height: none; max-width: none; box-shadow: none;
    animation: none !important; transform: none !important; visibility: visible !important;
  }
  .daily-bonus-welcome { width: 520px; }
  .daily-bonus-notice { width: 294px; }
  .daily-bonus-welcome::backdrop { background: transparent; backdrop-filter: none; animation: none; }
  .daily-bonus-welcome button, .daily-bonus-notice button { outline: none !important; transition: none; }
  .daily-bonus-glow { animation: none !important; transform: translate(0, 0) scale(1.26); filter: hue-rotate(0deg) brightness(1.04); }
  .daily-bonus-topped-up .daily-bonus-glow { transform: translate(0, 0) scale(1.08); filter: brightness(1); }
  .daily-bonus-notice-art img { animation: none !important; transform: translate(0, 0) scale(1.18); filter: brightness(1.08); }
`;
const style = document.createElement('style');
style.textContent = `${baseCss}
  #exports { padding: 32px; color: #242424; background: #f3f3f3; min-height: 100vh; }
  #exports h1 { font-size: 23px; }
  #exports figure { margin: 24px 0; width: fit-content; }
  #exports img { display: block; max-width: 100%; height: auto; }
  #exports a { display: inline-block; margin-top: 10px; color: #904714; }
  #exports figcaption { margin-top: 10px; font-size: 13px; }
`;
document.head.append(style);

const asDataUrl = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Asset export failed: ${url}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

async function embeddedFontCss() {
  const faces = [font400, font500, font600, font700].flatMap(css => [...css.matchAll(/@font-face\s*\{[^}]+\}/g)].map(match => match[0]));
  return (await Promise.all(faces.filter(face => /inter-(?:cyrillic|latin|latin-ext)-\d+-normal\.woff2/.test(face)).map(async face => {
    const file = face.match(/url\(\.\/files\/([^)]*\.woff2)\)/)[1];
    const data = await asDataUrl(`/node_modules/@fontsource/inter/files/${file}`);
    return face.replace(/src:[^;]+;/, `src: url("${data}") format('woff2');`);
  }))).join('\n');
}

async function exportCard(element, fontCss, label, filename) {
  await document.fonts.ready;
  await Promise.all([...element.querySelectorAll('img')].map(img => img.decode()));
  const bounds = element.getBoundingClientRect();
  const width = Math.ceil(bounds.width);
  const height = Math.ceil(bounds.height);
  const clone = element.cloneNode(true);
  // A normal block serializes predictably inside SVG; retain every original class.
  const surface = document.createElement('div');
  surface.className = clone.className;
  surface.innerHTML = clone.innerHTML;
  surface.style.width = `${width}px`;
  surface.style.height = `${height}px`;
  await Promise.all([...surface.querySelectorAll('img')].map(async img => { img.src = await asDataUrl(img.src); }));

  const wrapper = document.createElement('div');
  const exportStyle = document.createElement('style');
  exportStyle.textContent = `${fontCss}\n${welcomeCss}\n${noticeCss}\n${baseCss}`;
  wrapper.style.cssText = `width:${width}px;height:${height}px;font-family:Inter,Arial,sans-serif;font-synthesis:none;`;
  wrapper.append(exportStyle, surface);
  const markup = new XMLSerializer().serializeToString(wrapper);
  const scale = 4;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}"><foreignObject width="${width}" height="${height}">${markup}</foreignObject></svg>`;
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.getContext('2d').drawImage(image, 0, 0);
  const png = canvas.toDataURL('image/png');
  const figure = document.createElement('figure');
  const preview = document.createElement('img');
  preview.src = png;
  preview.alt = label;
  preview.width = width;
  preview.height = height;
  const caption = document.createElement('figcaption');
  caption.textContent = `${label} — ${canvas.width} × ${canvas.height} px · PNG · прозрачные углы`;
  const download = document.createElement('a');
  download.href = png;
  download.download = filename;
  download.textContent = `Скачать ${label.toLowerCase()}`;
  figure.append(preview, caption, download);
  document.getElementById('exports').append(figure);
}

async function run() {
  const fonts = await embeddedFontCss();
  const root = createRoot(document.getElementById('export-root'));
  const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  flushSync(() => root.render(<DailyBonusWelcome onClose={() => {}} onStart={() => {}} />));
  await nextFrame();
  await exportCard(document.querySelector('.daily-bonus-welcome'), fonts, 'Приветственная плашка', 'welcome-bonus-4x.png');
  flushSync(() => root.render(null));
  const anchor = document.createElement('span');
  document.body.append(anchor);
  const anchorRef = { current: anchor };
  flushSync(() => root.render(<DailyBonusNotice anchorRef={anchorRef} onClose={() => {}} onStart={() => {}} />));
  await nextFrame();
  await exportCard(document.querySelector('.daily-bonus-notice'), fonts, 'Уведомление об обновлении бонуса', 'daily-bonus-notice-4x.png');
  flushSync(() => root.render(<DailyBonusWelcome variant="topped-up" onClose={() => {}} onStart={() => {}} />));
  await nextFrame();
  await exportCard(document.querySelector('.daily-bonus-welcome'), fonts, 'Баланс пополнен', 'balance-topped-up-4x.png');
  root.unmount();
  anchor.remove();
  document.getElementById('export-status').textContent = 'Готово. Все три плашки экспортированы из актуальных компонентов в масштабе 4×.';
}
run().catch(error => {
  document.querySelector('dialog')?.close();
  document.getElementById('export-status').textContent = `Ошибка экспорта: ${error.message}`;
});
