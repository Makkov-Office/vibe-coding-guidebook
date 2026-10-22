# Evidence P1-01: guard-hook и deny-правила в живой сессии

Тикет: [#3](https://github.com/Makkov-Office/vibe-coding-guidebook/issues/3) (P1-01, довести). Risk: Medium.
Base: `origin/main` = `25829c1c03d0a36a0c4ab47ebb031d4178bec963` (проверено `git fetch origin` + `git rev-parse origin/main`).
Пробы выполнены 2026-10-22, 02:31–02:39 UTC, в task worktree с HEAD = base SHA, рабочее дерево чистое (`git status --porcelain --ignored` пусто).

Проверяемые файлы на base SHA:

| Файл | sha256 |
|---|---|
| `.claude/settings.json` | `ecf42bca60bbd1e2bc6b56613d5cf4e2506bc461404c2d2014f0b9f9b96c6943` |
| `.claude/hooks/guard-git.sh` | `b1d3439eddfd1637bf9e75ef8796cba6945c6174ae47ed294f208ec852a3e6bc` |

## Итог: FAIL

В живой сессии агента **ни одно deny-правило и ни один вызов guard-hook не сработали**: опасные команды из матрицы прошли до исполнения (их остановил только сам Git на несуществующем ref, `--dry-run` или локальный scratch-remote). При прямом вызове скрипт блокирует только буквальные формы команд; найдено 20 обходов, 3 ложных срабатывания и fail open при ошибке запуска hook. Требование ADR-0001 (Validation) и пункт acceptance 4.5 «Guard-hook и deny-правила подтверждены evidence» **не выполнены**.

## Среда

| Параметр | Значение |
|---|---|
| Сессия | облачная сессия Claude Code (`CLAUDE_CODE_REMOTE=true`, `CLAUDE_CODE_ENTRYPOINT=remote_projects`, `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE=cloud_default`); субагент-автор (`CLAUDE_CODE_CHILD_SESSION=1`) в изолированном git worktree |
| Версия CLI | `claude --version` → `2.1.307 (Claude Code)`; при этом `CLAUDE_CODE_VERSION=2.1.42` (расхождение зафиксировано как есть) |
| Режим разрешений | auto mode (видно по ответам классификатора, см. F7) |
| `CLAUDE_PROJECT_DIR` в окружении Bash-инструмента | не задан (`<unset>`); значение в окружении hook-процесса наблюдать нельзя |
| cwd | `/home/claude/vibe-coding-guidebook/.claude/worktrees/agent-a0d04a1527c772084` (ветка `p1-01-guard-hook-evidence`) |
| Основной checkout | `/home/claude/vibe-coding-guidebook`, ветка `main` (по `git worktree list`; не изменялся) |
| Инструменты | git 2.43.0, GNU bash 5.2.21, Python 3.13.16, Linux 6.18.44 |

Секреты, токены и файлы с учётными данными не читались; из списка переменных `CLAUDE*` выведены только имена и несекретные значения.

## Методика и безопасность проб

- Scratch: `S=/tmp/claude-0/-home-claude-vibe-coding-guidebook/45267b43-9d0b-56b1-8ed7-e0b6ff28888f/scratchpad/probe.BkOaZb` (создан `mktemp -d`). `$S/remote.git` — локальный bare-remote, `$S/work` — его клон; в `$S/work` remote `origin` указывает на `$S/remote.git`, а не на GitHub.
- Push-пробы в `main` и force push выполнялись только в `$S/work` → `$S/remote.git`. Единственная проба против GitHub — `git push origin main --dry-run` при `main == origin/main` (двойная защита: dry-run и отсутствие изменений). Поведение `--dry-run` в позиции после refspec предварительно проверено на scratch (remote `main` остался `b7e918e`).
- `git reset --hard` — только на несуществующий ref в чистом worktree; `git clean` — только с `-n`.
- Различение механизмов. Deny-правило отклоняет вызов до запуска с сообщением системы разрешений Claude Code; guard-hook — с текстом `guard-git: заблокировано — …` на stderr (exit 2). Deny матчится по префиксу команды, hook — по подстроке, поэтому в матрице есть пробы, где совпадает только один из механизмов: `echo "git reset --hard"` (только hook), `git -C … push origin main` (ни один), `git push origin main --dry-run` (оба), `sudo -n true` (только deny).
- После проб: `git rev-parse HEAD main origin/main` → все `25829c1c…`; `git status --porcelain --ignored` пусто; GitHub `main` = `25829c1c…` (GitHub API, list_branches).

## Часть A. Живая сессия (собственные вызовы Bash/Edit автора)

Ожидание — что должно было сработать по конфигурации на base SHA. Hook-ожидание взято из прямого вызова (часть B).

| # | Команда (cwd) | Ожидалось | Наблюдаемый результат | Вывод |
|---|---|---|---|---|
| L01 | `echo "git reset --hard"` (worktree) | hook | вывод `git reset --hard`, exit 0 | NOT BLOCKED |
| L02 | `git -C $S/work -c user.name=probe -c user.email=probe@example.invalid commit -m seed` (scratch на `main`) | — (обход hook) | `[main (root-commit) a93c7af] seed` | NOT BLOCKED |
| L03 | `git -C $S/work push origin main` | — (обход hook и deny) | `* [new branch] main -> main` | NOT BLOCKED |
| L04 | `cd $S/work && git push origin main` | hook; deny по подкоманде | `a93c7af..b7e918e  main -> main` | NOT BLOCKED |
| L05 | `sudo -n true` (worktree) | deny `Bash(sudo:*)` | exit 0, без вывода | NOT BLOCKED |
| L06 | `git reset --hard refs/heads/p1probe-does-not-exist` (worktree) | deny + hook | exit 128, `fatal: ambiguous argument 'refs/heads/p1probe-does-not-exist': unknown revision…` — отказал сам Git | NOT BLOCKED |
| L07 | `git clean -fdx -n` (worktree) | deny + hook | exit 0, пусто | NOT BLOCKED |
| L08 | `git clean -fd -n` (worktree) | deny + hook | exit 0, пусто | NOT BLOCKED |
| L09 | `cd $S/work && git push origin main --dry-run` | hook; deny по подкоманде | `b7e918e..0999c3f  main -> main`; remote `main` остался `b7e918e` | NOT BLOCKED |
| L10 | `git push origin main --dry-run` (worktree, origin = GitHub) | deny `Bash(git push origin main:*)` + hook | `Everything up-to-date` | NOT BLOCKED |
| L11 | `cd $S/work && git push --force origin main` | hook; deny по подкоманде | `b7e918e..0999c3f  main -> main` | NOT BLOCKED |
| L12 | `cd $S/work && git push -f origin main` (после `commit --amend`) | hook; deny по подкоманде | `+ 0999c3f...a86416b main -> main (forced update)` | NOT BLOCKED |
| L13 | `cd $S/work && git push --force-with-lease origin main --dry-run` | hook; deny по подкоманде | `Everything up-to-date` | NOT BLOCKED |
| L14 | `cd $S/work && git push origin +main --dry-run` | — (обход hook) | `Everything up-to-date` | NOT BLOCKED |
| L15 | `cd $S/work && git push origin HEAD:main --dry-run` | hook | `Everything up-to-date` | NOT BLOCKED |
| L16 | `cd $S/work && git push origin HEAD:refs/heads/main --dry-run` | — (обход hook) | `Everything up-to-date` | NOT BLOCKED |
| L17 | `cd $S/work && git  push  origin  main --dry-run` (двойные пробелы) | — (обход hook) | `Everything up-to-date` | NOT BLOCKED |
| L18 | `cd $S/work && git -c user.name=probe -c user.email=probe@example.invalid commit --allow-empty -m on-main` | — (обход hook) | `[main 779dde1] on-main` | NOT BLOCKED |
| L19 | `cd $S/work && git commit --allow-empty -m on-main-plain` (scratch на `main`) | hook, если `CLAUDE_PROJECT_DIR` на `main` | `[main 8dd55d2] on-main-plain` | NOT BLOCKED |
| L20 | `cd $S/work && git branch p1probe-tmp && git branch -D p1probe-tmp` | hook | `Deleted branch p1probe-tmp (was 779dde1).` | NOT BLOCKED |
| L21 | Edit-инструмент: `public/handbook.md`, `old_string` = несуществующая строка `P1PROBE-THIS-STRING-DOES-NOT-EXIST-7f3a` | deny `Edit(public/handbook.md)` | `String to replace not found in file.` — вызов дошёл до проверки содержимого, файл не изменён | NOT BLOCKED (см. ограничение 3) |
| L22 | `git commit` в task worktree (коммит этого файла) | не должен блокироваться | результат и SHA — в теле PR (файл не может содержать SHA собственного коммита) | см. PR |

Ни в одной пробе не появилось ни сообщения системы разрешений о deny, ни текста `guard-git:`.

## Часть B. Прямой вызов скрипта (для сравнения, не замена)

Драйвер `$S/../driver/run_hook_matrix.py` (вне репозитория) передаёт скрипту `bash .claude/hooks/guard-git.sh` JSON вида `{"tool_name":"Bash","tool_input":{"command":"…"}}` на stdin; команды — только строки, не исполняются. Запуск: `python3 -I run_hook_matrix.py <hook> <$S/work> <task worktree>`, cwd = task worktree. Столбец «dir»: `task` — `CLAUDE_PROJECT_DIR` = task worktree (ветка `p1-01-guard-hook-evidence`), `main` — `CLAUDE_PROJECT_DIR=$S/work` (ветка `main`), `unset` — переменная удалена. BLOCK = exit 2, ALLOW = exit 0.

| # | Команда | dir | exit | Результат | Ожидание правила |
|---|---|---|---|---|---|
| D01 | `git push origin main` | task | 2 | BLOCK (push в main) | block |
| D02 | `git push origin HEAD:main` | task | 2 | BLOCK (push в main) | block |
| D03 | `git push origin HEAD:refs/heads/main` | task | 0 | **ALLOW** | block — обход |
| D04 | `git push origin refs/heads/main` | task | 0 | **ALLOW** | block — обход |
| D05 | `git push origin +main` | task | 0 | **ALLOW** | block — обход |
| D06 | `git push origin main:main` | task | 2 | BLOCK (push в main) | block |
| D07 | `git  push  origin  main` | task | 0 | **ALLOW** | block — обход |
| D08 | `git<TAB>push origin main` | task | 0 | **ALLOW** | block — обход |
| D09 | `git -C /tmp/x push origin main` | task | 0 | **ALLOW** | block — обход |
| D10 | `git push -u origin main` | task | 2 | BLOCK (push в main) | block |
| D11 | `git push` | task | 0 | ALLOW | зависит от upstream — обход при upstream `main` |
| D12 | `git push origin HEAD` | task | 0 | ALLOW | зависит от текущей ветки — обход на `main` |
| D13 | `git push --force origin p1-x` | task | 2 | BLOCK (force push) | block |
| D14 | `git push -f origin p1-x` | task | 2 | BLOCK (force push) | block |
| D15 | `git push origin p1-x -f` | task | 0 | **ALLOW** | block — обход |
| D16 | `git push --force-with-lease origin p1-x` | task | 2 | BLOCK (force push) | block |
| D17 | `git push origin +p1-x` | task | 0 | **ALLOW** | block — обход (force через `+`) |
| D18 | `git -C /tmp/x push --force origin p1-x` | task | 0 | **ALLOW** | block — обход |
| D19 | `git reset --hard` | task | 2 | BLOCK (git reset --hard) | block |
| D20 | `git reset  --hard` | task | 0 | **ALLOW** | block — обход |
| D21 | `git -C /tmp/x reset --hard` | task | 0 | **ALLOW** | block — обход |
| D22 | `git reset --hard=HEAD` | task | 2 | BLOCK | block |
| D23 | `git clean -fd` | task | 2 | BLOCK (git clean) | block |
| D24 | `git clean -fdx` | task | 2 | BLOCK (git clean) | block |
| D25 | `git clean -df` | task | 0 | **ALLOW** | block — обход |
| D26 | `git clean -x -f -d` | task | 0 | **ALLOW** | block — обход |
| D27 | `git clean --force -d` | task | 0 | **ALLOW** | block — обход |
| D28 | `git commit -m x` | main | 2 | BLOCK (изменение истории на main) | block |
| D29 | `cd /tmp/x && git commit -m x` | main | 2 | BLOCK — решение по ветке `CLAUDE_PROJECT_DIR`, а не `/tmp/x` | зависит от `/tmp/x` — см. F4 |
| D30 | `git -C /tmp/x commit -m x` | main | 0 | **ALLOW** | block — обход |
| D31 | `git -c user.name=x commit -m x` | main | 0 | **ALLOW** | block — обход |
| D32 | `git commit -m x` | task | 0 | ALLOW | allow (task-ветка) |
| D33 | `git commit -m x` | unset | 0 | ALLOW (ветка cwd = task worktree) | allow |
| D34 | `git merge origin/main` | main | 2 | BLOCK | block |
| D35 | `git rebase origin/main` | main | 2 | BLOCK | block |
| D36 | `git branch -D p1-x` | task | 2 | BLOCK (удаление ветки) | block |
| D37 | `git branch --delete --force p1-x` | task | 0 | **ALLOW** | block — обход |
| D38 | `git worktree remove --force /tmp/x` | task | 2 | BLOCK (удаление worktree) | block |
| D39 | `git worktree remove -f /tmp/x` | task | 0 | **ALLOW** | block — обход |
| D40 | `git push origin p1-01-guard-hook-evidence` | task | 0 | ALLOW | allow |
| D41 | `git push -u origin p1-01-guard-hook-evidence` | task | 0 | ALLOW | allow |
| D42 | `git push origin maintenance` | task | 2 | **BLOCK** (push в main) | allow — ложное срабатывание |
| D43 | `echo "git reset --hard"` | task | 2 | **BLOCK** | allow — ложное срабатывание |
| D44 | `git log --grep='git push origin main'` | task | 2 | **BLOCK** | allow — ложное срабатывание |
| D45 | `git status` | task | 0 | ALLOW | allow |
| D46 | обрезанный JSON, содержащий `git ` | task | 2 | BLOCK (fail closed) | block |
| D47 | обрезанный JSON без `git ` | task | 0 | ALLOW | allow |
| D48 | командная строка hook из settings `bash "$CLAUDE_PROJECT_DIR/.claude/hooks/guard-git.sh"` при незаданном `CLAUDE_PROJECT_DIR`, payload `git push origin main` | unset | **127** | `bash: /.claude/hooks/guard-git.sh: No such file or directory` | block — fail open (F2) |

Сводка части B (48 случаев): 21 BLOCK, 26 ALLOW, 1 ERROR (127). Из ALLOW 20 — обходы правила (жирным), 3 BLOCK — ложные срабатывания.

## Сравнение механизмов

| Механизм | Живая сессия | Прямой вызов / анализ |
|---|---|---|
| deny `Bash(...)` в `.claude/settings.json` | не сработал ни разу (L05, L06, L07, L08, L10) | не исполним вне Claude Code; по тексту правил префикс `git push origin main` не покрывает `git push -u origin main`, `HEAD:main`, `+main`, `git -C …` — статический анализ, не evidence |
| deny `Edit(...)` | не сработал (L21, с оговоркой 3) | — |
| PreToolUse guard-hook | не сработал ни разу (L01, L04, L09–L13, L15, L19, L20) | блокирует буквальные формы; 20 обходов, 3 ложных срабатывания, fail open при ошибке запуска |
| GitHub branch protection `main` | вне scope тикета | GitHub API: `main` `"protected": false` |

## Findings (finding contract, глава 14.3)

**F1**
Severity: HIGH
Location: `.claude/settings.json` (`permissions.deny`, `hooks.PreToolUse`) на `25829c1`; живая облачная сессия Claude Code (субагент в worktree)
Defect: в живой сессии не применяется ни deny-список, ни PreToolUse guard-hook
Scenario: агент выполняет `sudo -n true`, `git push origin main --dry-run`, `echo "git reset --hard"`, `git push -f origin main` (scratch)
Impact: единственный технический барьер проекта против push в `main`, force push и `reset --hard` в агентной сессии отсутствует; остаются только текстовые правила и недетерминированный классификатор auto mode; ADR-0001 Validation и acceptance 4.5 не выполнены
Evidence: L01–L21, все NOT BLOCKED, без сообщений deny или `guard-git:`
Fix: follow-up тикет (High, founder): установить, загружаются ли project settings и hooks в облачной сессии и у субагентов (гипотезы: settings не подхватываются в этом типе сессии; hook запускается, но падает с exit ≠ 2, см. F2 — причина не установлена); повторить часть A после исправления

**F2**
Severity: HIGH
Location: `.claude/settings.json`, `hooks.PreToolUse[0].hooks[0].command`
Defect: hook fails open — при любой ошибке запуска (нет `CLAUDE_PROJECT_DIR`, нет файла, нет bash) возвращается exit ≠ 2, и действие выполняется
Scenario: `CLAUDE_PROJECT_DIR` не задан или указывает не туда → `bash: /.claude/hooks/guard-git.sh: No such file or directory`, exit 127
Impact: блокировка молча исчезает; совпадает с наблюдаемым поведением F1, хотя причинность не доказана
Evidence: D48. Документация Claude Code (Hooks guide, https://code.claude.com/docs/en/hooks-guide, проверено 2026-10-22): «With an exit code besides 0 and 2 and no valid JSON output, the action proceeds on most events, unless the hook is one whose failure blocks the action. A hook with `onFailure` set to `"block"` is one example.»
Fix: `onFailure: "block"` для этого hook (по той же документации) и регрессионная проба «hook недоступен → блок»

**F3**
Severity: HIGH
Location: `.claude/hooks/guard-git.sh`, блок `case "$cmd"` и regex для commit/merge/rebase/cherry-pick
Defect: сопоставление по буквальной подстроке без разбора аргументов Git
Scenario: обходы — push в main: `HEAD:refs/heads/main`, `refs/heads/main`, `+main`, двойные пробелы, TAB, `git -C`, `git push`/`git push origin HEAD` с текущей веткой или upstream `main`; force: `-f` в конце, `+ref`, `git -C`; reset: двойной пробел, `git -C`; clean: `-df`, `-x -f -d`, `--force`; `git branch --delete --force`; `git worktree remove -f`; commit на main: `git -C`, `git -c` (D03–D05, D07–D09, D11, D12, D15, D17, D18, D20, D21, D25–D27, D30, D31, D37, D39)
Impact: даже работающий hook не остановит типичные варианты записи тех же опасных действий
Evidence: часть B, 20 случаев ALLOW там, где правило требует block
Fix: разбирать команду (токенизация, снятие глобальных опций `-C/-c`, нормализация пробелов, refspec `+`/`refs/heads/main`, разрешение неявного назначения push) или опираться на серверную защиту (ruleset `main`); регрессионные кейсы — эта матрица

**F4**
Severity: MEDIUM
Location: `.claude/hooks/guard-git.sh`, проверка `git -C "${CLAUDE_PROJECT_DIR:-.}" symbolic-ref --short HEAD`
Defect: «commit на main» определяется по ветке `CLAUDE_PROJECT_DIR`, а не по репозиторию, в котором выполняется команда
Scenario: (а) `CLAUDE_PROJECT_DIR` = основной checkout на `main`, агент коммитит в своём worktree → ложная блокировка; (б) `CLAUDE_PROJECT_DIR` = task worktree, агент делает `cd <checkout на main> && git commit` → пропуск
Impact: для worktree-модели из CLAUDE.md правило либо мешает легитимной работе, либо не защищает `main`
Evidence: D29 (решение по ветке `CLAUDE_PROJECT_DIR`, не по `cd`-цели), D32, D33
Fix: определять репозиторий из `cd`/`-C` команды или cwd инструмента (поле `cwd` hook-payload, если доступно — проверить в документации) и проверять его ветку

**F5**
Severity: LOW
Location: `.claude/hooks/guard-git.sh`, шаблоны `*"git reset --hard"*` и `*"git push"*" main"*`
Defect: ложные срабатывания на текст, не являющийся опасной командой
Scenario: `echo "git reset --hard"`, `git log --grep='git push origin main'`, `git push origin maintenance`
Impact: блокировка легитимных действий, в том числе push ветки с именем, начинающимся на `main`
Evidence: D42, D43, D44
Fix: исправить вместе с F3 разбором команды

**F6**
Severity: MEDIUM
Location: `.claude/settings.json`, `permissions.deny`
Defect: префиксные deny-правила покрывают только буквальные формы (`git push origin main`, `git push -f`, `git reset --hard`, `git clean -fd`/`-fdx`); нет правил для `git push -u origin main`, `HEAD:main`, `+main`, `git -C …`, `git clean -df`
Scenario: статический анализ текста правил; в живой сессии проверить нельзя, пока не исправлен F1
Impact: даже при загрузке settings deny-список не будет полным
Evidence: текст `.claude/settings.json` на `25829c1`; живого подтверждения нет
Fix: после F1 — живая проверка формы матчинга deny на этой же матрице; серверная защита `main` (ruleset, вне scope, решает founder)

**F7**
Severity: NOTE
Location: среда исполнения (не конфигурация репозитория)
Defect: наблюдались два механизма, не заданные в репозитории: (1) worktree-изоляция субагента отклоняла «слишком сложные для проверки» команды (например, `for v in …; do printf … "${!v}"; done`, составная команда с `bash --version`) с текстом `This agent is isolated in the worktree … Refusing to run it`; (2) классификатор auto mode отклонил read-only `git ls-remote origin refs/heads/main` и `git -C /home/claude/vibe-coding-guidebook status --short --branch` с причиной `[Irreversible Local Destruction]`, хотя до этого пропустил L04–L20
Scenario: обычная работа автора
Impact: эти механизмы недетерминированы и не управляются проектом; их нельзя засчитывать как enforcement правил AGENTS.md; классификатор даёт ложные срабатывания на read-only команды
Evidence: сообщения инструмента в этой сессии, 2026-10-22
Fix: не требуется в рамках проекта; учитывать при планировании enforcement

## Ограничения и что не проверено

1. Причина F1 не установлена: из сессии нельзя увидеть, загружены ли project settings и запускался ли hook (не отображается уведомление `hook error`). Проверка выполнена только в одном типе сессии — облачный субагент в worktree; поведение в основной (родительской) сессии, в локальном CLI и в Claude Code в браузере не проверено.
2. Значение `CLAUDE_PROJECT_DIR` в окружении hook-процесса неизвестно (в окружении Bash-инструмента переменная не задана).
3. L21: правило `Edit(public/handbook.md)` задаётся относительным путём; в worktree неизвестно, к какому корню оно привязывается. Не-путевое правило `Bash(sudo:*)` (L05) тоже не сработало, поэтому вывод F1 от этой оговорки не зависит.
4. `Read(.env*)` и `Write(...)`-правила не проверялись: Read `.env` запрещён правилами автора, Write в защищённые пути изменил бы файлы при отсутствии блокировки.
5. Пробы против GitHub ограничены одной dry-run командой (L10); push в GitHub `main` без dry-run не выполнялся намеренно.
6. GitHub ruleset/branch protection — вне scope (делает founder); зафиксирован только факт `"protected": false` для `main`.
