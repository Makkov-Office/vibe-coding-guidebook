@AGENTS.md

# Специфика Claude Code

`[HCC: <раздел>]` — обзор «Claude Code: рабочий процесс внутри проекта» в handbook; `[Hnn.m]` — как в AGENTS.md.

## Изоляция
- MUST: один тикет — отдельная task branch в своей изолированной папке; не работать в checkout другого автора или человека [H05] [H08.1].
- SHOULD: изолированная папка — worktree (`claude --worktree` или `git worktree add`) [H11.1] [HCC: Агенты и worktrees].
- MUST NOT: считать worktree разрешением конфликтов: он изолирует файлы, но не смысл contracts [H13] [HCC: Агенты и worktrees].
- MAY: `/batch` для хорошо разделяемой миграции после проверки границ единиц [HCC: Агенты и worktrees].

## Plan mode
- SHOULD: для незнакомого репозитория, миграции и задач с чувствительными командами — сначала plan mode (`/plan` или `Shift+Tab`), правки — после согласования плана [HCC: Планирование и работа до цели].
- MUST NOT: считать effort или режим разрешений заменой human gate [H15] [HCC: Планирование и работа до цели].
- MUST NOT: считать shell sandbox изоляцией file tools, MCP и hooks [HCC: Планирование и работа до цели].
- MAY: `/goal` с наблюдаемым условием завершения для работы внутри assigned scope [HCC: /goal].

## Субагенты
- MAY: субагент для исследования или bounded подзадачи; он работает под ответственностью primary author и не становится вторым owner PR [H05] [HCC: Агенты и worktrees].
- MUST: реализацию тикета ведёт один автор [H05] [HCC: Агенты и worktrees].
- MUST: независимое review — отдельный субагент или сессия без авторского контекста; передать PR URL, тикет и ссылки на правила, не своё summary [H14.1] [H14.4].
- MUST: reviewer-субагент работает read-only: не меняет код, не делает merge, не публикует в GitHub без отдельного разрешения [H14.4] [H17.2].
- MUST: verdict reviewer привязан к HEAD SHA; после нового push — новый review [H14.4].

## Память и инструкции
- SHOULD: в CLAUDE.md держать команды, соглашения и ограничения проекта [HCC: Контекст, правила и возвращение к работе].
- MUST: проверять, какие инструкции фактически загружены (`/memory`, `/context`), включая этот AGENTS.md [HCC: Контекст, правила и возвращение к работе].
- MUST NOT: считать память или CLAUDE.md границей разрешений; enforcement — permissions, hooks и branch rules [H21] [HCC: Контекст, правила и возвращение к работе].
- MUST: после `--continue`, `--resume` или compaction восстановить scope, evidence и незавершённые gates [H09.3].

## Review-команды
- MAY: `/code-review`, `/security-review` как дополнительный проход [HCC: Review и безопасность].
- MUST NOT: считать их заменой независимого review, запуска приложения, evidence и решения человека о merge [H14] [HCC: Review и безопасность].

## Permissions и hooks
- SHOULD: дополнять текстовые правила исполнимыми ограничениями — permissions и hooks; в Agent Pack это `claude/settings.json` и `claude/hooks/` [H03.1] [H19].
- MUST NOT: ослаблять deny-правила и hooks без решения человека [H15] [H17.2].
- MUST: проверять, применяются ли permissions и hooks в текущей среде; неподтверждённое enforcement считать отсутствующим [H08.3] [H21].
