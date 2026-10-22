@AGENTS.md

## Специфика Claude Code

- Работай в отдельной ветке/worktree на тикет, не в основном checkout.
- Plan mode для тикетов Medium/High: сначала план, потом правки.
- Независимое review — отдельный субагент без авторского контекста: передай ему PR, тикет и ссылки на правила, не своё резюме.
- `.claude/settings.json` содержит deny-правила и PreToolUse-hook `.claude/hooks/guard-git.sh`. Не ослабляй их; изменение этих файлов — High risk, нужен founder.
- Хостинг — Vercel (проект `vibe-coding-guidebook`, команда `makkov-design`): preview на каждый PR, закрыт Deployment Protection. Production выключен (`vercel.json` и Ignored Build Step проекта, ADR-0002) до отдельного решения founder после P1-08; merge в `main` деплой не создаёт.
- Отчёты founder — по-русски, коротко: сделано, evidence, BLOCKED, нужные решения, следующий шаг.
