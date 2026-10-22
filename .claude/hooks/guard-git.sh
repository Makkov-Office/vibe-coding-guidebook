#!/usr/bin/env bash
# PreToolUse guard: blocks destructive Git commands and history changes on main.
# Input: hook JSON on stdin (tool_input.command, cwd). Exit 2 = block, message on stderr.
# The analysis lives in guard_git.py next to this file; see its docstring.
# Fail closed: any outcome other than an explicit "allow" (exit 0) of the
# analyzer is a block. Only bash builtins are used before python3 starts.
set -u

payload=""
IFS= read -r -d '' payload || true

here="${BASH_SOURCE[0]%/*}"
[ "$here" = "${BASH_SOURCE[0]}" ] && here="."

if ! command -v python3 >/dev/null 2>&1 || [ ! -r "$here/guard_git.py" ]; then
  # "git" followed by whitespace, a JSON escape (\t, \n) or the end of a JSON string
  if [[ "$payload" =~ git([[:space:]]|\\[tn]|\") ]]; then
    echo "guard-git: анализатор недоступен (python3 или guard_git.py), Git-действие заблокировано (fail closed). См. AGENTS.md." >&2
    exit 2
  fi
  exit 0
fi

printf '%s' "$payload" | python3 -I "$here/guard_git.py"
rc=$?
if [ "$rc" -eq 0 ] || [ "$rc" -eq 2 ]; then
  exit "$rc"
fi
echo "guard-git: анализатор завершился с кодом $rc, действие заблокировано (fail closed). См. AGENTS.md." >&2
exit 2
