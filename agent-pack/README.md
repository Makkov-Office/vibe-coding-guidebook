# Agent Pack

Версия: 0.1.0 (структура и нормативные правила).

Набор файлов, который переносит правила handbook Mastering Agentic Engineering в репозиторий, где работает AI-агент. Агент читает `AGENTS.md` как контракт: роли, жизненный цикл тикета, preflight, review, human gates и post-merge sync. Каждое правило имеет силу MUST / SHOULD / MAY и ссылку `[Hnn.m]` на главу и раздел handbook, где оно определено.

## Состав

| Путь | Что это | Статус в 0.1.0 |
|---|---|---|
| `AGENTS.md` | Нормативный контракт агента, ≤ 150 строк | Готов |
| `CLAUDE.md` | `@AGENTS.md` + специфика Claude Code: worktree, plan mode, субагент-ревьюер | Готов |
| `skills/` | Процедуры по необходимости: preflight, independent-review, post-merge-sync, docs-impact, spec-conflict, handoff | Заготовка |
| `schemas/` | JSON Schema 2020-12 для ticket, preflight-report, evidence-record, finding, handoff, decision-packet | Заготовка |
| `claude/` | `settings.json` с deny-списком опасных git-команд и hooks | Заготовка |

## Как подключить

1. Скопируйте содержимое `agent-pack/` в корень своего репозитория. Если `AGENTS.md` или `CLAUDE.md` уже есть, сохраните свои правила проекта и добавьте правила пакета отдельным разделом или файлом.
2. Для Claude Code `CLAUDE.md` импортирует `AGENTS.md` строкой `@AGENTS.md`. Агенты, которые читают `AGENTS.md` напрямую, используют его без изменений.
3. Допишите правила своего проекта: команды проверки, имена веток, risk policy, PR template. Правила проекта уточняют пакет там, где они строже или конкретнее.
4. Проверьте в новой сессии, что инструкции действительно загружены (в Claude Code — `/memory`).

## Ссылки на handbook

`[H08.2]` — глава 08, раздел 8.2. `[HCC: <раздел>]` — обзор инструмента «Claude Code: рабочий процесс внутри проекта». Пакет не вводит новых правил: всё, что в нём есть, определено в handbook.
