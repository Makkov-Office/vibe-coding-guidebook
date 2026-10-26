---
name: docs-impact
description: Решение Docs Impact по фактическому diff — какие contracts и документы меняются и обновлены ли они в том же PR. Загружать перед открытием PR и после каждого существенного изменения diff.
---

# docs-impact

`[Hnn.m]` — глава и раздел handbook, как в `AGENTS.md`.

Вопрос: изменяет ли PR поведение, контракт, workflow или публичные инструкции, которые должны быть задокументированы? [H10.3]. Ожидание задаётся полем `docs_impact_expectation` тикета (`schemas/ticket.schema.json`).

## Шаги
1. MUST: проверить фактический diff, а не план [H10.3].
2. MUST: определить affected contracts и документы по таблице ниже [H10.1] [H10.3].
3. MUST: обновить нужные источники в том же PR либо оформить допустимый explicit follow-up [H10.3].
4. MUST: объяснить «нет Docs Impact», если это так [H10.3].
5. MUST: проверить ссылки, anchors, старые пути и согласованность examples [H10.3].

| Артефакт | Вопрос | Обновлять, когда [H10.1] |
|---|---|---|
| Product spec | Что должно происходить и зачем? | Изменилось approved поведение |
| Architecture | Где границы системы? | Изменились responsibilities или interfaces |
| ADR | Почему принято решение? | Выбор с долговременными последствиями |
| Execution plan | Как выполнить работу? | В ходе задачи; затем по repo policy |
| Engineering contract | Как обязан работать агент/разработчик? | Изменился workflow или проверяемое правило |
| Testing docs | Чем доказывается корректность? | Изменились команды или testing obligations |

## Правила
- MUST NOT: переписывать spec задним числом под код [H10.1].
- MUST NOT: удалять принятый ADR; новый ADR supersede старый со ссылкой [H10.2].
- MUST: грамматику machine-readable PR header брать из текущего PR template/скрипта, не выдумывать [H10.3].
- MUST: декларация категории не равна семантической проверке; соответствие docs коду проверяют автор и reviewer [H10.3].
- MUST: после изменения PR body перепроверить body-sensitive checks [H11.2].

## Выход
Строка Docs Impact в PR: `none` с объяснением / `updated` со списком документов / `follow-up` со ссылкой. Проверка ссылок и anchors — evidence по `schemas/evidence-record.schema.json`.
