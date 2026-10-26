---
name: preflight
description: Проверка тикета, среды, свежего main, ownership, risk, Docs Impact и коллизий до первых правок. Загружать перед началом работы над любым тикетом и после handoff.
---

# preflight

`[Hnn.m]` — глава и раздел handbook, как в `AGENTS.md`.

Preflight проверяет эту задачу в этой среде сейчас [H08]. Результат — документ по `schemas/preflight-report.schema.json`.

## Входы
- Актуальный тикет по `schemas/ticket.schema.json`: статус, dependencies, source_docs [H08.1].
- Entrypoint и contracts репозитория: AGENTS.md → ARCHITECTURE.md → docs/index.md → профильные contracts [H08.1].

## Шаги
1. MUST: получить актуальный тикет, статус, dependencies и исходные документы [H08.1].
2. MUST: прочитать entrypoint и профильные contracts репозитория [H08.1].
3. MUST: проверить repo identity, remote, branch, HEAD, worktrees и локальные изменения [H08.1].
4. MUST: обновить main через документированный безопасный fetch; записать полный base SHA [H08.1].
5. MUST: установить owner; создать или переиспользовать разрешённую task branch/worktree с точным именем из тикета [H08.1] [H11.1].
6. MUST: проверить DoR, capabilities и bootstrap/doctor [H06.2] [H08.1].
7. MUST: оценить risk, Docs Impact, active PRs и collision class [H08.1] [H12.2] [H13.1].
8. MUST: записать plan, blockers и merge order, если он нужен [H08.1].
9. MUST: только при `result: PASS` перевести тикет в In Progress и начать реализацию [H08.1].

## Правила
- MUST: значения заполняются из реальных checks; угловые скобки и примеры — не evidence [H08.2].
- MUST: FAIL — обнаруженное нарушение; BLOCKED — не хватает решения или capability; INCOMPLETE — обязательное evidence не получено. Ни одно не равно PASS [H08.2].
- MUST: недоступный diff, список PR или owner — INCOMPLETE, а не пустое значение [H08.3].
- MUST: класс коллизии — `isolated`, `file overlap only`, `contract dependency`, `direct conflict`; неизвестный — `unknown` и не PASS для зависимого решения [H13.1] [H13.2].
- MUST: учитывать open PR, local-only commits, staged/unstaged/untracked paths в разрешённой области [H13.2].
- MUST NOT: очищать грязный чужой checkout ради preflight; работать в своей папке [H08.1].
- MUST NOT: создавать ветку поверх существующего имени и применять force-флаги при ownership conflict [H11.1].

## Выход
JSON по `schemas/preflight-report.schema.json`. Пример — `schemas/examples/preflight-report.json`.
