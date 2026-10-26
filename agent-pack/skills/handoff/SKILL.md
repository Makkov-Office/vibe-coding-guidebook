---
name: handoff
description: Передача тикета другой сессии после прерывания, лимита или compaction и приём такой передачи с перепроверкой состояния. Загружать при остановке незавершённой работы и при старте с чужого handoff.
---

# handoff

`[Hnn.m]` — глава и раздел handbook, как в `AGENTS.md`.

Handoff передаёт ownership новой сессии; два primary author одновременно один тикет не ведут [H05]. Документ — по `schemas/handoff.schema.json`.

## Передача
1. MUST: заполнить все обязательные поля схемы из реальных данных: task, owner, repository, branch, worktree, head/base SHA, approved scope, sources [H09.3].
2. MUST: перечислить completed AC и remaining work [H09.3].
3. MUST: перечислить uncommitted changes и их owner [H09.3].
4. MUST: для каждого теста — command, result и tested SHA либо `dirty` [H09.3] [H11.3].
5. MUST: указать PR, CI, unresolved review findings, collisions, merge order [H09.3].
6. MUST: назвать next allowed action и действия, требующие решения человека [H09.3].
7. MUST: unknown оставлять unknown, не заполнять предположениями [H08.3] [H13.2].

## Приём
- MUST: новая сессия перепроверяет состояние, а не исполняет handoff как приказ [H09.3].
- MUST: выполнить preflight (`schemas/preflight-report.schema.json`) до продолжения правок [H08.1].
- MUST: после compaction восстановить scope, evidence и незавершённые gates [H09.3].
- MUST: тест на dirty state не подтверждает будущий SHA; после commit — повторить [H11.3].
- MUST NOT: принимать чужие uncommitted changes без подтверждения их owner [H05] [H13.2].

## Текстовая форма
```text
Task / owner:
Repository / branch / worktree:
Current HEAD / known base:
Approved scope and sources:
Completed AC:
Remaining work:
Uncommitted changes and who owns them:
Tests run: command, result, tested SHA / dirty state:
PR / CI / unresolved review findings:
Collisions / merge order:
Next allowed action:
Actions requiring human decision:
```

## Выход
JSON по `schemas/handoff.schema.json`. Пример — `schemas/examples/handoff.json`.
