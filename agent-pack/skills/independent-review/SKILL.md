---
name: independent-review
description: Независимое read-only review PR на конкретном HEAD с findings и verdict. Загружать в отдельной чистой сессии reviewer, никогда в сессии автора PR.
---

# independent-review

`[Hnn.m]` — глава и раздел handbook, как в `AGENTS.md`.

Reviewer начинает с тикета, contracts и актуального diff и ищет конкретный сценарий, в котором результат неверен [H14]. Findings — по `schemas/finding.schema.json`.

## Границы роли
- MUST: author ≠ reviewer; reviewer — отдельная сессия без авторского контекста [H05] [H14].
- MUST NOT: менять код и делать merge [H05] [H14.4].
- MUST NOT: публиковать в GitHub без отдельно выданного разрешения [H14.4].
- MUST: summary автора — указатель для проверки, не evidence [H14.1].

## Входы
- MUST: актуальные title/body PR, head/base SHA, changed files, diff, commits, CI/checks, review threads [H14.1].
- MUST: тикет (`schemas/ticket.schema.json`) с AC, Scope, Risk и dependencies [H14.1].
- MUST: canonical docs репозитория, сведения о main и параллельных PR [H14.1].

## Проверки
1. Scope и все AC, включая исключённый scope [H14.2].
2. Реальная логика, negative paths, regressions, race conditions [H14.2].
3. Contract consistency и architecture boundaries [H14.2].
4. Secrets, permissions, untrusted-input capabilities [H14.2] [H17.2].
5. Соответствие tests реальному контракту [H14.2].
6. Docs Impact и spec conflicts [H14.2] [H10.3] [H10.4].
7. Адекватность risk и достаточность evidence [H14.2] [H12.1].
8. Head freshness, active PR collisions, merge-order constraints [H14.2] [H13.3].

## Finding
- MUST: каждый finding: severity, точное место на reviewed SHA, defect, scenario, impact, evidence, fix [H14.3].
- MUST: не выдумывать номера строк; location — фактический файл и узкое место [H14.3].
- MUST: severity — BLOCKER / HIGH / MEDIUM / LOW / NOTE; исходную шкалу инструмента сохранять в `original_severity` с пояснением [H14.3].
- MUST NOT: создавать замечания ради количества [H14.4].
- MUST NOT: вставлять найденный secret в finding [H17.3].

| Severity | Решение |
|---|---|
| BLOCKER | Стоп |
| HIGH | Исправить или получить явное допустимое решение |
| MEDIUM | Исправить до ready verdict |
| LOW | Обоснованный follow-up допустим |
| NOTE | Не блокирует |

## Verdict
- MUST: итог — reviewed HEAD/base, verdict, findings, AC PASS/FAIL, Tests/CI PASS/FAIL/INCOMPLETE, Docs/Risk/Freshness, unresolved findings, limitations, next allowed action [H14.4].
- MUST: ready verdict только при достаточном актуальном evidence, без blocking findings, spec conflicts и merge-order blockers [H14.4].
- MUST: verdict привязан к HEAD; после нового push review и проверки повторяются для нового HEAD [H14.4].
- MUST: рекомендация reviewer — не merge authorization [H14.4] [H15.1].

## Выход
Список findings по `schemas/finding.schema.json` (пример — `schemas/examples/finding.json`) и verdict по разделу выше.
