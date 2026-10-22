#!/usr/bin/env bash
# PreToolUse guard: blocks destructive Git commands and direct work on main.
# Input: hook JSON on stdin (tool_input.command). Exit 2 = block, message on stderr.
set -u

payload="$(cat)"
cmd="$(printf '%s' "$payload" | python3 -c 'import json,sys
try:
    print(json.load(sys.stdin).get("tool_input",{}).get("command",""))
except Exception:
    print("")' 2>/dev/null)"

# Fail closed: if the command could not be parsed, block Git-looking payloads.
if [ -z "$cmd" ]; then
  if printf '%s' "$payload" | grep -q 'git '; then
    echo "guard-git: не удалось разобрать команду, Git-действие заблокировано (fail closed)." >&2
    exit 2
  fi
  exit 0
fi

block() { echo "guard-git: заблокировано — $1. См. AGENTS.md." >&2; exit 2; }

case "$cmd" in
  *"git reset --hard"*)            block "git reset --hard" ;;
  *"git clean -f"*)                block "git clean" ;;
  *"git push"*"--force"*|*"git push -f"*|*"git push"*" -f "*) block "force push" ;;
  *"git push"*" main"*|*"git push"*":main"*|*"git push"*"HEAD:main"*) block "push в main" ;;
  *"git branch -D"*)               block "принудительное удаление ветки" ;;
  *"git worktree remove --force"*) block "принудительное удаление worktree" ;;
esac

# Commits on main are blocked: work happens in task branches.
if printf '%s' "$cmd" | grep -qE '(^|[;&| ])git (commit|merge|rebase|cherry-pick)( |$)'; then
  branch="$(git -C "${CLAUDE_PROJECT_DIR:-.}" symbolic-ref --short HEAD 2>/dev/null || echo "")"
  if [ "$branch" = "main" ]; then
    block "изменение истории на main (текущая ветка main)"
  fi
fi

exit 0
