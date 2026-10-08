# Аудит интерактивных компонентов — 2026-10-08

## Охват

Фактически используемые кнопки и ссылки интерфейса; чеклисты главы 22 и других reader contexts; radio scenarios DEMO-42; поля поиска и glossary filter; native dropdown темы; drawer/dialog; disclosures code/diagram/static panel. Desktop и ширины 320, 360, 768, 1024, 1440. Inline glossary links сохраняют текстовый размер и проверены отдельно как навигация.

## Найдено и исправлено

| Проблема | Причина | Исправление |
| --- | --- | --- |
| Чеклист расползается | Универсальное input rule: checkbox фактически 774 × 44 px на desktop | Правила text inputs отделены от checkbox/radio; checkbox 20 × 20 px, label hit area 44 × 44 px |
| Неясные подписи checkbox | Каждому input присваивался текст всего списка | Accessible name содержит только свой пункт; storage keys сохранены |
| Выравнивание и мобильные переносы | Checkbox и текст были одним обычным inline flow | Grid с фиксированной колонкой control и переносимым текстом; графитовые группы, разделители, hover/checked/focus states |
| Radio controls наследуют стили text fields | Частичные overrides ширины/min-height | Отдельные dimensions/padding; selected scenario имеет видимый фон/границу и focus state |
| Dropdown и filter fields | Browser arrow и свободная ширина flex label | Native select сохранён; Tabler ChevronDown, достаточный right padding, mobile stack, длинные значения не расширяют страницу |
| Неодинаковые состояния controls | Неявные placeholders и disabled appearance | Явный muted placeholder, hover borders, disabled appearance; reset не активен до hydration |

## Проверка

Regression сначала воспроизвёл ошибку: expected checkbox width 20, received 774. После исправления прошли keyboard Space, persistence/reload/reset и индивидуальные names всех пунктов. Label clickable area измерена: 44px, focus outline 2px, checked state работает. Text input/select в mobile filter — 48px height, reset button — 44px; поля остаются внутри контейнера.

11 browser tests passed: дополнительно narrow-width form geometry, dropdown keyboard selection/reset, radio dimensions и Enter disclosure toggle. Остальные tests покрывают search/clear/close, drawer, glossary navigation, panel selection, copy success/failure, storage denial, print/no-JS, axe и Mermaid. Typecheck, ESLint и 4 content tests passed. Учебный source/download не изменён; 0 unexplained glossary gaps.

Визуально просмотрены desktop/mobile checklist, checked/focused state, mobile filter/dropdown и lifecycle. Captures: `screenshots/checklist-desktop.png`, `checklist-mobile.png`, `checklist-focused.png`, `controls-mobile.png`. Native select popup управляется браузером; собственный dropdown runtime не добавлен. Ручной screen-reader прогон не выполнялся.
