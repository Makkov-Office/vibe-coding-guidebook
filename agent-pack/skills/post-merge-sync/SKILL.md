---
name: post-merge-sync
description: Безопасная синхронизация после подтверждённого merge — проверка merge, fetch, fast-forward main без потери локальных данных, refresh зависимых PR. Загружать после merge PR.
---

# post-merge-sync

`[Hnn.m]` — глава и раздел handbook, как в `AGENTS.md`.

Merge меняет remote main; локальные checkout, сессии и зависимые PR узнают об этом безопасно [H16]. Каждый шаг записывается как evidence по `schemas/evidence-record.schema.json`.

## Последовательность
1. MUST: проверить подтверждённое состояние merge и merge commit [H16.1].
2. MUST: проверить статус тикета (Done) и связь с PR; при необходимости синхронизировать статус [H16.1].
3. MUST: обновить remote main через documented fetch policy — явным обновлением main [H16.1] [H16.2].
4. MUST: проверить integration checkout: branch, dirty state, worktree ownership [H16.1].
5. MUST: проверить tracked, untracked и ignored-file collisions до смены branch и до fast-forward [H16.1] [H16.2].
6. MUST: обновить local main только fast-forward; при divergence — стоп [H16.1] [H16.4].
7. MUST: для зависимых PR — refresh и revalidation [H16.1] [H13.3].
8. MUST: подтвердить delivery state; deployment проверять отдельно от merge [H16.1].
9. MAY: убирать branches/worktrees только после проверки merged state, уникальных commits, локальных и ignored данных и полномочий [H16.1].

## Ловушки
- MUST: `git fetch --prune origin` при restricted refspec может не обновить `origin/main`; использовать явное обновление main или отклонить конфигурацию [H16.2].
- MUST: auto-delete remote branch не убирает local branch/worktree и не подтверждает безопасность удаления [H16.1].

## Восстановление
| Сбой | Действие [H16.3] |
|---|---|
| Dirty integration checkout | Сохранить ownership и изменения; не reset/clean |
| Local main diverged | Зафиксировать divergence; решение человека, не force reset |
| Ignored-file collision | Защитить файл, разрешить конфликт до перехода |
| main checked out elsewhere | Designated integration owner |
| Unique commits в task branch | Не удалять до проверки происхождения commits |
| Failed fetch | Не считать remote-tracking ref свежим |

- MUST NOT: применять универсальную destructive «repair command» [H16.3].

## Автоматизация
- MUST: auto-sync только в назначенном integration checkout на main с подтверждённым ownership [H16.4].
- MUST: нет dirty state, незавершённых merge/rebase и параллельного sync [H16.4].
- MUST NOT: удалять task branches, чужие worktrees, уникальные commits, volumes, credentials [H16.4].
- MUST: результат — SYNCED / UP_TO_DATE / SKIPPED / FAILED с причиной; FAILED не становится успехом из-за exit 0 [H16.4].
- MUST: background auto-update — только с ownership и lock contract [H16.4].
- MUST NOT: считать git.autofetch заменой post-merge sync [H16.4].

## Выход
Main SHA, sync result (SYNCED / UP_TO_DATE / SKIPPED / FAILED), оставшиеся blockers; каждая проверка — `schemas/evidence-record.schema.json`.
