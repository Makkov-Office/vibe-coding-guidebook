// Каскад (приём 6, docs/design/visual-language.md, «Движение»): реестр групп, чьи дочерние элементы появляются
// друг за другом. Страница ничего не вызывает: CSS (app/motion.css) анимирует первые STAGGER_CAP детей каждой
// группы при отрисовке, а reveal.ts показывает детей ниже экрана по мере прокрутки. Тот же список — в
// app/motion.css, правило «6. Каскад» (сверяет tests/motion-groups.test.mjs). Новая группа — строка здесь и там
// либо атрибут data-stagger на контейнере.

/** Группы каскада: появление при отрисовке и при прокрутке. Порядок — сверху страницы вниз. */
export const STAGGER_GROUPS=[
  '[data-stagger]',
  // Навигация: пункты rail, мега-меню и меню «Разделы» на телефоне.
  '.rail-list','.mega-menu','.mega-list','.section-list','.bottom-bar',
  // Шаблон страницы: баннер, табы, тело.
  '.page-hero__text','.page-hero__meta','.page-tabs ul','.page-body',
  '.reader-prose',
  // Главная.
  '.home-cards','.home-next','.home-footer',
  // Соседние страницы.
  '.ct-pager','.chapter-pagination',
];

/** Сколько детей группы получают свой шаг; дальше — все вместе с последним (совпадает с --stagger-cap в tokens.css). */
export const STAGGER_CAP=14;

/** Селектор детей всех групп — для reveal.ts. */
export const STAGGER_CHILDREN=STAGGER_GROUPS.map((group)=>`${group}>*`).join(',');
