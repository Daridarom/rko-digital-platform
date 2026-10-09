// Тематические иконки разделов. Один стиль: поле 24×24, линия 1.6, без заливки, цвет — currentColor.
// Те же иконки сборка кладёт отдельными файлами в assets/img/icons/ — для подключения в CMS.
export const ICONS = {
  conference: '<rect x="9" y="3" width="6" height="10" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>',
  document: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  media: '<rect x="3" y="5" width="18" height="14"/><path d="M10 9l5 3-5 3z"/>',
  newspaper: '<path d="M4 5h13v14H4z"/><path d="M17 9h3v10h-3"/><path d="M7 9h7M7 12.5h7M7 16h4"/>',
  rocket: '<path d="M12 2c3 2.5 4.5 6 4.5 10v4h-9v-4C7.5 8 9 4.5 12 2z"/><circle cx="12" cy="10" r="1.75"/><path d="M7.5 13l-3 3.5V19h3M16.5 13l3 3.5V19h-3M10 19.5V22M14 19.5V22"/>',
  planet: '<circle cx="12" cy="12" r="6"/><ellipse cx="12" cy="12" rx="10.5" ry="3.4" transform="rotate(-25 12 12)"/>',
  book: '<path d="M12 6c-2-1.5-4.5-2-8-2v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V4c-3.5 0-6 .5-8 2zM12 6v14"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M10 17h4v3h-4zM8 20h8"/>',
  magnet: '<path d="M6 3v9a6 6 0 0 0 12 0V3h-4v9a2 2 0 0 1-4 0V3z"/><path d="M6 7.5h4M14 7.5h4"/>',
  bulb: '<path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/><path d="M10 20.5h4"/>',
  pen: '<path d="M4 20l1.2-4.8L16.5 3.9a2 2 0 0 1 2.8 0l.8.8a2 2 0 0 1 0 2.8L8.8 18.8z"/><path d="M14.5 6l3.5 3.5M12 20h8"/>',
  leaf: '<path d="M5.5 18.5C5 10.5 10 5 20 4c.5 9-4.5 15-14.5 14.5z"/><path d="M4 20c3-5 6.5-8.5 11-11"/>',
  presentation: '<path d="M3 4h18M4.5 4v11h15V4M12 15v3M8 21l4-3 4 3"/><path d="M8.5 11.5v-2M12 11.5v-4M15.5 11.5v-3"/>',
  stars: '<path d="M10.5 3l1.9 5.6 5.6 1.9-5.6 1.9-1.9 5.6-1.9-5.6L3 10.5l5.6-1.9z"/><path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>',
  shield: '<path d="M12 2.5l8 3v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10v-6z"/><path d="M12 7.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z"/>',
  sprout: '<path d="M12 21v-9M8 21h8"/><path d="M12 12c0-4.5 2.5-7 7.5-7 0 5-2.5 7-7.5 7z"/><path d="M12 15.5c0-3.5-2-5.5-6.5-5.5 0 4 2 5.5 6.5 5.5z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 4 6 4 9s-1.2 6-4 9c-2.8-3-4-6-4-9s1.2-6 4-9z"/>',
  folder: '<path d="M3 6h6l2 2.5h10V19H3z"/>',
};

// Раздел материалов → иконка. Новому разделу без пары достаётся «папка»; в CMS это поле раздела.
const CATEGORY_ICONS = [
  [/^Конференции/, 'conference'], [/^Публикации/, 'document'], [/^Медиа/, 'media'], [/^Газета/, 'newspaper'],
  [/^Космонавтика/, 'rocket'], [/^Фантастика/, 'planet'], [/^Издания/, 'book'], [/^Конкурсные работы/, 'trophy'],
  [/^Научная школа/, 'magnet'], [/^Полезно знать/, 'bulb'], [/^Конкурс эссе/, 'pen'], [/биосферного/, 'leaf'],
  [/^Презентации/, 'presentation'], [/^Ближе к космосу/, 'stars'], [/^Курс лекций/, 'cap'], [/^Мир Героев/, 'shield'],
  [/Экофилософии/, 'sprout'], [/Вернадский/, 'globe'],
];
export const categoryIcon = (title) => (CATEGORY_ICONS.find(([re]) => re.test(title)) || [null, 'folder'])[1];

export const icon = (name, size = 28) => `<svg class="rko-ico" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false">${ICONS[name] || ICONS.folder}</svg>`;

export const iconFile = (name) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter">${ICONS[name]}</svg>\n`;
