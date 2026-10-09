# Независимый UX/UI аудит — 9 октября 2026

Аудит выполнен отдельным агентом. Проверялись исходники и локальный сайт `http://127.0.0.1:5173` через временную браузерную вкладку. Пользовательская вкладка и production не изменялись. Исправления выполнял основной агент; этот агент не менял код интерфейса.

## Находки

| Приоритет | Место | Проблема и доказательство | Исправление / перепроверка |
| --- | --- | --- | --- |
| P2 | `src/components/Reader.tsx`, поиск | Запрос «агент», 8 нажатий ArrowDown: выбранная запись имела top 1479 px, когда видимая область результатов была 281–655 px. У input отсутствовал `aria-activedescendant`. Выбор был невидимым и не сообщался assistive technology. | Исправлено основным агентом. Повторный browser check: выбранный результат видим, input `role=combobox`, `aria-activedescendant=search-result-8`, запись `role=option`. Escape возвращает focus кнопке поиска. |
| P2 | `src/content/compiler.mjs`, `Reader.tsx`, чеклисты | Полный текст пункта находился в соседнем `div.practice-text`, а label включал только checkbox. Текст не активировал checkbox. | Основной агент добавил активацию текстовой области с исключением links/controls. Browser: click текста меняет false→true; собственная тестовая отметка возвращена в false. |
| P2 | `app/chapters/[number]/page.tsx`, `/glossary`, `/print` | Все страницы наследовали одинаковый brand title: вкладки и история не различали разделы. | Добавлены отдельные metadata. Browser: glossary title «Глоссарий · ULTIMATE Vibe-coder guidebook [BETA]». |
| P2 | `Reader.tsx`, footer | Сброс чеклистов показывался даже на страницах без чеклистов. При первом исправлении оказался скрыт и в главе 06: chapter.html в client metadata намеренно пуст. | Основной агент передал серверный признак наличия чеклистов. Browser: chapter06 и chapter22 показывают reset; chapter03 не показывает. |
| P2 | `ContextPreview.tsx` | Термины в панели примера не получали role/button и «Объяснить термин», поскольку MutationObserver наблюдал только reader. В reader и contextual panel были разные семантики одной функции. | Расширено наблюдение панели. Browser: term links в example panel получают `role=button`, tooltip находится внутри dialog. |
| P2 | `ContextPreview.tsx`, copy status | Сообщение копирования не очищалось при открытии другого содержимого панели и могло относиться к предыдущему примеру. Подтверждено чтением state/update code. | Основной агент добавил очистку status при смене content. Не проверялся реальный отказ clipboard или повторное копирование в браузере. |
| P2 | `Reader.tsx`, мобильный drawer | Нажатие по подложке не закрывало меню. Browser320: drawer rect left38/right320; click x8/y400 оставлял `open=true`. | Передано основному агенту для закрытия по backdrop с проверкой bounds. Состояние исправления нужно сверить после финальных изменений. |
| P2 | `Reader.tsx`, Enter в поиске | Основной агент при своем browser QA воспроизвел повторное открытие поиска: Enter закрыл dialog, onClose вернул focus на trigger, default Enter активировал trigger. | Основной агент добавил preventDefault и подавление возврата focus при переходе к результату. Независимый агент не перепроверял этот finding. |

## Фактическая проверка

- Карта главы 02 на 320, 360, 768, 1024 и 1440 px: horizontal document overflow отсутствует; sidebar скрыт до1024 и виден от1024; outline появляется на1440. Reading column: 288/328/688/680/800 px соответственно.
- Мобильное меню: переход к главе02 заканчивается actual navigation и закрытым drawer. Прежняя гипотеза о незакрывающемся меню отвергнута: Reader remount закрывает dialog.
- Guided карта320: один видимый узел; переход «Далее» меняет шаг1→2 и detail на Repository knowledge.
- DEMO-42: проверены Happy path, Review findings и Unavailable evidence. Текст результата соответствует выбранному сценарию. Отдельный Post-merge sync узел меняет detail.
- Tooltip Entrypoint в chapter03 открывается над термином, получает `aria-describedby=term-tooltip`, закрывается Escape.
- Example drawer desktop: немодальный `dialog.show()`. Mobile360: `:modal=true`, body scroll locked, высота680px при viewport800px (85dvh), horizontal overflow отсутствует; tooltip укладывается в горизонтальные границы; закрытие снимает lock и возвращает focus к «Открыть рядом».
- Chapter06 после исправления: outline headings H1→H2→H2. Chapter22@320: 20 checkbox, каждый20px; horizontal overflow отсутствует.
- Glossary:394 определения; невозможный запрос скрывает все, reset возвращает394 и пустой query.
- В проверенной вкладке отсутствовали captured console errors на этапе проверки checkbox.
- Desktop screenshot lifecycle визуально проверен: карточки pagination выровнены, radio labels не перекрываются, detail и nodes читаемы.
- Collision panel13: все4 кнопки меняют detail title и соответствующий aria-label SVG. Disclosure контракта открывается, copy control включен.
- Maturity21: M0–M5 проверены; detail меняется и содержит capabilities / exit критерии.
- Прогресс21: первая отметка меняет1→2, отмена возвращает1. Reset click привел к CDP timeout; getJsDialog вернул undefined, последующие DOM/close тоже timeout. Тестовая вкладка2 могла остаться с native confirm. Reset не принимался; факт успешного cancel не утверждается. Основному агенту сообщено для восстановления браузера.

## Границы проверки

Не выполнялись полный screen-reader проход, измерение всех rendered contrast pairs, реальное 200% browser zoom, browser no-JS/print, искусственные storage/clipboard failures и полный перебор всех glossary definitions/anchors. Native mobile focus trap основан на showModal; полный циклический клавиатурный обход требует отдельного подтверждения (Tab с последнего элемента может переводить focus в chrome браузера). В процессе локального аудита основной агент редактировал код, поэтому отдельные наблюдения делались до/после HMR; это явно отражено в таблице.

Проверка является аудитом основных взаимодействий и responsive состояний, а не доказательством отсутствия всех возможных багов.

## Перепроверка основным агентом

После финальных правок: mobile320 click backdrop x8/y400 закрывает drawer, focus возвращается «Открыть меню глав». Поиск материала How I use LLMs + Enter:0 открытых dialogs, hash и focus у ch-resources-item-how-i-use-llms-andrej-karpathy. Исправления backdrop и Enter подтверждены root browser QA. Нормализованы уровни заголовков reader H1/H2/H3 и interactive panels H2/H3 с сохранением типографики. Очистка copy status подтверждена кодом; повторный browser failure-injection не выполнялся. Все8 принятых findings исправлены; перечисленные границы проверки сохраняются.
