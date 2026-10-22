@AGENTS.md

## Специфика Claude Code

- Работай в отдельной ветке/worktree на тикет, не в основном checkout.
- Plan mode для тикетов Medium/High: сначала план, потом правки.
- Независимое review — отдельный субагент без авторского контекста: передай ему PR, тикет и ссылки на правила, не своё резюме.
- `.claude/settings.json` содержит deny-правила и PreToolUse-hook `.claude/hooks/guard-git.sh` (анализатор `guard_git.py`, регрессия `tests/guard-git.test.mjs` в `npm test`). Не ослабляй их; изменение этих файлов — High risk, нужен founder.
- Где это действует: локальная сессия и облачная сессия с одним репозиторием вне Projects читают `.claude/settings.json`. В облачных thread'ах Claude Code Projects permission rules и hooks репозитория **не применяются**: так говорит страница Settings документации Claude Code и так наблюдалось в сессиях P1-01 и P1-01b. Оговорка: страница Projects утверждает обратное для проекта с одним репозиторием, противоречие не разрешено (`docs/evidence/p1-01b-harness-enforcement.md`). Поэтому на hook и deny в Projects не полагайся. Там правила AGENTS.md соблюдаешь сам, а техническая защита `main` — только на стороне GitHub. Hook запускается из `$CLAUDE_PROJECT_DIR` (каталог старта сессии), то есть в версии из `main`.
- Хостинг — Vercel: production из `main`, preview на PR. Деплой в production — только через merge в `main` после решения founder.
- Отчёты founder — по-русски, коротко: сделано, evidence, BLOCKED, нужные решения, следующий шаг.
