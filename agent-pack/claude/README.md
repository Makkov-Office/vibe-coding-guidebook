# claude/

Защита для Claude Code. Подключение: скопировать `settings.json` и `hooks/` в `.claude/` своего репозитория.

- `settings.json` — deny-список опасных команд (push в `main`, force push, `reset --hard`, `clean -fd`, `sudo`, `rm -rf /`, чтение `.env`) и PreToolUse-hook для Bash.
- `hooks/guard-git.sh` + `hooks/guard_git.py` — анализатор Bash-команд: блокирует push в `main`, force push, `reset --hard`, `clean` без dry-run, `branch -D`, `worktree remove --force` и изменение истории, пока репозиторий на `main`. Fail closed: если анализатор не запустился, Git-действие блокируется. Нужен `python3`.

Ограничения: это guard rail, а не sandbox. Hook не видит git, запущенный из файлов скриптов, Makefile или npm scripts. Защищённая ветка задана константой `PROTECTED = "main"` в `guard_git.py`. Основная защита `main` — правила ветки на стороне хостинга репозитория. Проверьте, что permissions и hooks действительно применяются в вашей среде: неподтверждённое enforcement считается отсутствующим.
