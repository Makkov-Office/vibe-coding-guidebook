# ADR 0001: Один primary author на тикет, работа только в task-ветках

Status: Proposed — ждёт решения founder (вместе с PR P1-01)

Context: Проект разрабатывается агентами в облачных сессиях, часть работы идёт параллельно. Параллельные правки в одном checkout скрывают владение и портят evidence.

Decision: Каждый тикет имеет одного primary author, одну ветку `p<фаза>-<номер>-<slug>` и один PR. Прямые коммиты и push в `main` запрещены и блокируются `.claude/settings.json` и `.claude/hooks/guard-git.sh`. Merge — только по явному решению founder.

Alternatives: общий checkout; работа последовательно в main; независимые клоны.

Consequences: дополнительный lifecycle веток/worktree; ясная ответственность, воспроизводимое evidence.

Validation: попытка `git push origin main` и `git reset --hard` из сессии агента блокируется (evidence в PR P1-01). На GitHub — branch ruleset для `main` (required PR, required checks, без force push).

Revisit trigger: founder утверждает ADR о low-risk auto-merge (бриф, раздел 5.5).
