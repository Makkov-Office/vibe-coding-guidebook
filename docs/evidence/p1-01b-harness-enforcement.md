# Evidence P1-01b: enforcement harness в облачных сессиях и guard-hook

Тикет: [#17](https://github.com/Makkov-Office/vibe-coding-guidebook/issues/17) (P1-01b). Risk: High. Founder gate: комментарий в issue от 22.10.2026 04:28 UTC (изменение `.claude/` разрешено в рамках тикета; merge — отдельным решением founder).
Base ветки: `1aa11d9d7a08b2b768b1dcff724724ee014d5f66`; после review в ветку влит `origin/main`: `a4d1215` (P1-03 #14, P1-04 #15) merge-коммитом `66cc48c`, затем `80b066e` (P1-09 #19) merge-коммитом `8d99ac1`.
Код, к которому относятся проверки ниже: коммит `8d99ac197d09ccd9a41130737cea5bd3cf50fdbd` (ветка `p1-01b-harness-enforcement`; исправления review — `050ebe2`; файлы hook, settings, тестов и `CLAUDE.md` на `66cc48c` и `8d99ac1` совпадают). Эта редакция документа добавлена следующим коммитом и меняет только документацию. Первая итерация: код `47c0282`, review на `4347f95` — NOT READY (раздел «Review 4347f95»).
Дата проверок: 2026-10-22, 04:30–06:40 UTC. Входные данные: `docs/evidence/p1-01-guard-hook.md` (findings F1–F7, матрица D01–D53, пробы L01–L22) и находки review — перепроверены, а не приняты как решение.

| Файл на `8d99ac1` | sha256 |
|---|---|
| `.claude/settings.json` | `9cb0b80f40f1e092ecd7a549e113aced1d52dd80d09ce4aaa84b13344b85ac37` |
| `.claude/hooks/guard-git.sh` | `62d79cf12d71fc65f3b1f85034727b0ff913edb4960d7df5f63e667933d80b7e` |
| `.claude/hooks/guard_git.py` | `a7f0d93c3caaee70a75b8db8a6b5fd12437ccebbc81de1b5eeb07ea38704c9ee` |
| `tests/guard-git.test.mjs` | `11be223f43be83304962a3b34ae6a18c5c1bdca17e75feebac352af2dad3daa7` |
| `tests/fixtures/guard-git.base-1aa11d9.sh` (копия hook с base) | `b1d3439eddfd1637bf9e75ef8796cba6945c6174ae47ed294f208ec852a3e6bc` (совпадает с P1-01) |

## Итог

| Acceptance criterion (#17) | Результат | Основание |
|---|---|---|
| Пробы L01–L22 в живой облачной сессии: BLOCKED там, где ожидается; commit в task worktree проходит | **BLOCKED → вынесено в #21** | Решение founder: AC1 (живые пробы) вынесен в отдельный тикет #21, в этом PR живые пробы не требуются. Причина BLOCKED: в облачном thread'е Claude Code Projects permission rules и hooks из `.claude/settings.json` репозитория не применяются (документация, раздел F1). Это свойство среды, из репозитория не включается. Повторные пробы в этой сессии после изменения — по-прежнему NOT BLOCKED (часть C). Проба во вложенной локальной сессии `claude -p` отклонена классификатором auto mode (`[Create Unsafe Agents]`). Commit в task worktree проходит (`47c0282`) |
| Регрессионный тест матрицы в CI зелёный | **PASS** | CI (P1-04, #15 в `main`): run `39734047043`, head `8d99ac1` — success (`npm ci`, `npm run validate`, включая `npm test`); раньше run `39732310795` на `66cc48c` — success. Свежий clone `8d99ac1`: `npm test` 204/204, `npm run validate` PASS |
| Hook с отсутствующим скриптом/ошибкой блокирует (fail closed) | **PASS** (тест), live — не проверено | `tests/guard-git.test.mjs`: D48 через командную строку из `settings.json` под `sh` и `bash`, отсутствие python3, отсутствие/падение анализатора — exit 2. `onFailure: "block"` поддерживается установленным CLI 2.1.307 (раздел F2) |

## F1: почему deny и hook не применяются в этой сессии

### Наблюдения в сессии

| Параметр | Значение |
|---|---|
| Тип сессии | облачный thread проекта Claude Code: `CLAUDE_CODE_ENTRYPOINT=remote_projects`, `CLAUDE_CODE_PROJECTS_SESSION=1`, `CLAUDE_CODE_REMOTE=true`, `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE=cloud_default` (Anthropic-hosted); автор — субагент (`CLAUDE_CODE_CHILD_SESSION=1`) в изолированном worktree |
| Версия CLI | `claude --version` → `2.1.307`; диагностический лог сессии, событие `started` → `"version": "2.1.307"`. Переменная `CLAUDE_CODE_VERSION=2.1.42` с этим не совпадает; что она обозначает, не установлено |
| Каталог проекта | основной checkout `/home/claude/vibe-coding-guidebook` (ветка `main`); `CLAUDE.md` из него загружен |
| Диагностический лог | `settings_load_completed {"source_count": 2, "error_count": 0}` (8 раз); имена источников в логе не указаны, поэтому вывод о том, какие файлы загружены, из лога сделать нельзя |
| Пробы | L01, L05, L06, L07, L10, L20, L21, L22 после изменения — ни сообщения deny, ни текста `guard-git:` (часть C). L01 (`echo "git reset --hard"`) прошёл, хотя hook из основного checkout (версия base) его блокирует (D43 в P1-01): hook в этой сессии не запускается |
| Не проверено | `/status` (`Setting sources`) и `claude doctor` в этой сессии недоступны; чтение настроек запуска сессии (`launcher-settings.json`) отклонено классификатором (`[Credential Exploration]`) и не выполнялось |

### Документация Claude Code (проверено 2026-10-22)

1. [Settings → Settings in cloud sessions](https://code.claude.com/docs/en/settings#settings-in-cloud-sessions):
   > **Cloud threads in a project**: in a cloud thread in a project, none of a repository's `.claude/settings.json` permission rules, hooks, or `env` apply, however many repositories the project has.

   > **Shared project settings** (`.claude/settings.json`): read in a session with one repository outside a project's threads, because the file is part of the clone and the session starts inside it.

   > **User and project local settings** (`~/.claude/settings.json` and `.claude/settings.local.json`): not read.

   > **Managed settings**: a `managed-settings.json` file or MDM profile on your device doesn't reach a cloud session. Your organization's server-managed settings do.
2. [Projects → What threads pick up from your repositories](https://code.claude.com/docs/en/claude-projects#what-threads-pick-up-from-your-repositories):
   > Permission rules, hooks, and `env` come only from the `.claude/settings.json` in the directory the thread starts in.

   Таблица там же: для проекта с **одним** репозиторием — «Apply to the thread»; с **несколькими** — «Don't apply in an Anthropic-hosted environment». Раздел «Unblock a thread waiting on approval»:
   > **Several repositories, Anthropic-hosted environment**: no repository's permission rules reach a cloud thread, so you rely on auto mode and on the approvals you give inside each thread.
3. [Cloud environments → What carries over from your setup](https://code.claude.com/docs/en/cloud-environments#what-carries-over-from-your-setup): «Your repo's `.claude/settings.json` hooks and permission rules — Yes, in a session with one repository».
4. [Hooks reference](https://code.claude.com/docs/en/hooks): «Hooks from settings files, managed policy settings, and plugins also run inside subagents» — то, что автор работает субагентом, по документации причиной не является.
5. [Server-managed settings](https://code.claude.com/docs/en/server-managed-settings): «Server-managed settings are available for Claude for Teams and Claude for Enterprise customers»; [Projects](https://code.claude.com/docs/en/claude-projects): «Projects are in public beta on Pro and Max plans … They aren't available on Team or Enterprise plans yet». Значит, сейчас нельзя одновременно работать в Projects и доставлять политику через server-managed settings.
6. [Projects → Run a thread on your own computer](https://code.claude.com/docs/en/claude-projects#run-a-thread-on-your-own-computer): такой thread «Works with the files, tools, MCP servers, and Claude Code settings on that machine, including its hooks and permission rules».

### Вывод

- **Подтверждено (документация + наблюдение):** причина F1 — среда, а не репозиторий. Сессии этого проекта — облачные thread'ы Claude Code Projects; по странице Settings в таких thread'ах permission rules и hooks из `.claude/settings.json` репозитория не применяются. Наблюдение в двух сессиях (P1-01 и эта) с этим совпадает: deny и hook не срабатывают ни разу.
- **Противоречие источников (внешних, не тикета):** страница Projects утверждает, что в проекте с одним репозиторием правила и hooks применяются. Сколько репозиториев в этом проекте и где стартует thread, из сессии установить не удалось (просмотр каталогов вне worktree отклонён изоляцией). Гипотезы: H1 — в проекте больше одного репозитория или thread стартует выше clone; H2 — верна страница Settings (thread'ы проекта не применяют правила никогда). Ни одна гипотеза не открывает способа включить enforcement из репозитория.
- **Гипотеза, не подтверждённая источником:** записать `managed-settings.json` внутрь VM через setup script облачного окружения. Документация описывает чтение такого файла только для self-hosted окружения; для Anthropic-hosted — нет. Не полагаться без отдельной живой проверки.
- Дополнительно (по документации Hooks, «Reference scripts by path»): команда hook ссылается на `$CLAUDE_PROJECT_DIR/.claude/hooks/guard-git.sh`, а `CLAUDE_PROJECT_DIR` — корень, где стартовала сессия (основной checkout). Там, где settings применяются, до merge работает версия hook из `main`, а не из ветки PR.

### Что нужно сделать founder вне репозитория

1. **GitHub ruleset для `main`** (Settings → Rules → Rulesets): обязательный PR, запрет force push и удаления, без bypass для агентов. Единственная защита `main`, которая действует в облачных thread'ах Projects и для любых инструментов, включая GitHub MCP (F8). Вне scope этого тикета, входит в acceptance 4.5.
2. Для работы, где нужен рабочий hook и deny: запускать thread на своём компьютере через Remote Control (документация, п. 6) или облачную сессию с одним репозиторием **вне** Projects (п. 1, 3). Обе возможности описаны в документации, но в этом тикете не проверены: после merge повторить пробы из части D в такой сессии.
3. Project instructions (Project settings → Memory → Project instructions): продублировать MUST NOT из AGENTS.md. По документации Projects это «Text sent to each new thread», то есть текстовое правило, а не enforcement.
4. Server-managed settings — только при переходе на Team/Enterprise (п. 5).

## F2: fail closed при ошибке запуска hook

- Командная строка hook в `settings.json`: `bash "…/guard-git.sh"; rc=$?; [ "$rc" -eq 0 ] && exit 0; [ "$rc" -eq 2 ] || echo "…fail closed…" >&2; exit 2`. Нет `CLAUDE_PROJECT_DIR`, нет файла, нет bash, любой код выхода, кроме 0, → exit 2 (блок). Сообщение «hook не запустился» печатается только для кодов, кроме 0 и 2: обычный блок показывает одну причину от hook (review 4347f95, п. 4). Работает без опоры на версию CLI.
- `onFailure: "block"` и `timeout: 30` на той же записи — для таймаута и для случая, когда не запускается сама оболочка. Документация Hooks: «To block the action instead, set `"onFailure": "block"` on a `command` or `http` hook. Requires Claude Code v2.1.295 or later»; «With `"block"` set, a failure does what exit code 2 does on that event». Установленный CLI 2.1.307 поддерживает поле: в бинарнике `/opt/claude-code/bin/claude` есть строка `blocking because onFailure is "block"` (статическая проверка, не живая). JSON-схема schemastore (`www.schemastore.org/claude-code-settings.json`) поле `onFailure` пока не содержит, а для объекта hook задаёт `additionalProperties: false`; документация предупреждает, что схема отстаёт от CLI. Как поведёт себя CLI старше 2.1.295 с неизвестным полем, не проверено — поэтому fallback `|| exit 2` оставлен в самой команде.
- `guard-git.sh`: до запуска python3 использует только builtins bash; нет python3 или `guard_git.py` → Git-команды блокируются; анализатор вернул что-то кроме 0 или 2 → блок. `guard_git.py` при внутренней ошибке → exit 2.

## F3–F5: новый guard

`guard_git.py` разбирает команду, а не ищет подстроки:
- токенизация: кавычки, экранирование, `;` `&&` `||` `|` `&` перевод строки, скобки, комментарии, перенаправления, heredoc, `$(...)` и обратные кавычки (анализируются рекурсивно);
- снятие обёрток (`env`, `sudo`, `timeout`, `nice`, `nohup`, `time`, `command`, `exec`, `xargs`, `find -exec`, `watch`), рекурсивный разбор `bash -c`/`sh -c`, `eval`, `env -S`, git alias (`-c alias.*` и из config репозитория), `rebase --exec`, `bisect run`, `submodule foreach`;
- git: глобальные опции `-C`, `-c`, `--git-dir`, `--work-tree`; push — refspec с `+`, `refs/heads/`, `HEAD`/`@`, удаление, шаблоны, `--all`/`--branches`/`--mirror`/`--prune`, сокращения длинных опций (parse-options git), неявное назначение (`push.default`, upstream, `remote.*.push`); `reset --hard`; `clean` — разрешён только dry-run без force; `branch -D`/`--delete --force`; `worktree remove -f/--force`;
- ветка для commit/merge/rebase/cherry-pick/revert/am — по полю `cwd` payload, затем `cd`/`pushd`/`env -C`/`sudo -D`/`git -C` внутри команды и `checkout`/`switch` раньше в той же команде; `CLAUDE_PROJECT_DIR` не используется (F4). Неизвестный каталог, не-репозиторий, вычисляемый путь, изменение `GIT_*` в команде → блок (fail closed);
- динамические слова: `$var`, `$(...)`, brace expansion (`{a,b}`, `{1..3}`), glob (`*`, `?`, `[...]`), extglob (`@(...)`) — значение известно только при выполнении. Динамические подкоманда git, глобальная опция, любой аргумент push, опции `reset`/`clean`/`branch`/`worktree` → блок;
- состояние внутри одного вызова Bash (общее и для `bash -c`, alias, `$(...)`): `checkout`/`switch`, `branch -m/-M/-c/-C`, `symbolic-ref HEAD …` раньше в команде добавляют ветки-кандидаты для commit/merge/… и для `push HEAD`/`@`; запись `git config`, upstream (`branch -u`, `--track`, `push -u`, создание ветки), `git remote` раньше в команде → push без refspec и неизвестный alias блокируются;
- git, который запускает сам hook (`symbolic-ref`, `config --get`), — абсолютный путь из PATH самого hook. Из переменных команды проходят только `GIT_DIR`, `GIT_WORK_TREE`, `GIT_COMMON_DIR`, `GIT_CONFIG*`, `HOME`, `XDG_CONFIG_HOME`. Если команда меняет `PATH`, `LD_*`, `DYLD_*` (префикс, `env`, `export`, `+=`) — блок без запуска git;
- вычисляемое имя программы (`$(printf git) push …`, `${GIT:-git}`, `{git,x}`) → блок, если в нём есть `git` или первый аргумент — git-подкоманда из списка опасных (push, reset, clean, branch, worktree, checkout, switch, config, commit, merge, rebase и др.);
- правила base-версии (подстроки) по-прежнему применяются к сырому тексту, если в строке есть что-то кроме git и инертных программ (echo, printf, grep, cat, ls и т. п.), вывод в файл, динамическое слово с brace/glob или неразбираемая конструкция. Поэтому `echo "…" | bash`, `python3 -c "…"`, `echo "…" > run.sh`, `git reset --hard{,}` блокируются, как раньше.

### Review 4347f95: находки и исправления

Каждая находка воспроизведена до исправления (scratch-репозиторий: checkout на `main` + worktree `task1`; hook base и hook `4347f95`).

| # | Находка (review) | Воспроизведение на `4347f95` | Исправление (`050ebe2`) | Тесты |
|---|---|---|---|---|
| 1 HIGH | brace/glob в незакавыченном слове — литерал; для строки «только git» правила base не применялись | 8 форм: base block → new allow (`git reset --hard{,}`, `git push {--force,} origin task1`, `… main{,}`, `… HEAD:main{,}`, `… :main{,}`, `… {HEAD:main,x}`, `worktree remove --force{,}`, `reset --hard*`); ещё 6 пропускали оба | слово с brace/glob/extglob → dyn, строка не «чистая» (правила base снова действуют); dyn-аргументы push, глобальных опций, `branch`, `worktree` → блок | B01–B21 block, B30–B35 allow; в дифференциальном корпусе |
| 2 MEDIUM | push не учитывал `checkout`/`switch`/config раньше в строке | 6 форм: allow | `push HEAD`/`@` — кандидаты из текущей ветки и переключений; push без refspec — блок при любом переключении или записи config/upstream/remote; alias — блок после записи config | S01–S12 block, S20–S26 allow |
| 3 MEDIUM | hook запускал `git` из PATH команды | `PATH=<dir>/fakebin git push origin HEAD` — fake git запущен | абсолютный git из PATH hook, allowlist переменных, PATH/LD_*/DYLD_* → блок; присваивание `X="…"` распознаётся (раньше кавычки делали его «программой») | P01–P11; тест с fake git и маркером: из PATH команды не запускается, из PATH hook — запускается (контроль) |
| 4 LOW | fallback дописывал «hook не запустился» к каждому блоку | подтверждено чтением команды | сообщение только для кодов ≠ 0, 2 | «normal block prints only the hook's reason» (`sh`, `bash`) |
| 5 LOW | CLAUDE.md без оговорки о противоречии; docstring «unparseable is blocked» неверен для `$(printf git) push origin main` | allow | оговорка в CLAUDE.md; вычисляемое имя программы с git-признаком → блок; docstring исправлен, ограничения перечислены | C01–C03 block, C10 allow |
| 6 LOW | ветка отстала от `main` | — | merge `origin/main` (`a4d1215`, включая #14 и #15) merge-коммитом `66cc48c`; затем `80b066e` (#19) — `8d99ac1`; без конфликтов | CI run `39734047043` |

Найдено при исправлении и закрыто там же: `PATH+=… git`, `GIT_DIR="…" git commit` (кавычки в значении), `git branch -m main`, `git symbolic-ref HEAD refs/heads/main`, `bash -c 'git checkout main' && git commit` (переключение во вложенной команде терялось), `git push $R`, `git branch $OPT x`, `git worktree $SUB --force x`.

### Регрессионный тест (`tests/guard-git.test.mjs`, в `npm test`)

Временная структура как в CLAUDE.md: основной checkout на `main`, worktree на task-ветке, worktree с upstream `main`, detached worktree, каталог без git; изолированный git config. Команды передаются hook в payload и не исполняются.

| Группа | Случаи | Результат на `8d99ac1` |
|---|---|---|
| Матрица P1-01 | D01–D53: D11 и D12 — в обоих условиях (a/b/c), D29 — в обе стороны, D32/D33/D49/D50 — с разными `CLAUDE_PROJECT_DIR` | PASS |
| Обходы и fail closed | E01–E72 | PASS |
| Review 4347f95 | B01–B35 (brace/glob), S01–S26 (состояние в команде), P01–P11 (PATH/LD_*), C01–C10 (вычисляемое имя) | PASS |
| D46/D47, D48 и одно сообщение при блоке (`sh` и `bash`), settings, нет python3, нет/падает анализатор, fake git в PATH | 11 тестов | PASS |
| Дифференциальный тест против base-hook (fixture) | весь корпус выше (включая B/S/P/C) в двух каталогах: всё, что блокировал base, блокируется и сейчас, кроме перечисленных намеренных изменений | PASS |
| Всего `npm test` (content 7 + guard 197) | 204 | PASS (свежий clone, `npm ci`; CI run `39734047043`) |

Изменения ожидания по сравнению с P1-01 (все — по тексту findings):
- было ALLOW, теперь BLOCK — 19 безусловных обходов F3 (D03–D05, D07–D09, D15, D17, D18, D20, D21, D25–D27, D30, D31, D37, D39, D51) и условные D11b/c, D12b;
- было BLOCK, теперь ALLOW — ложные срабатывания F5: D42 (`maintenance`), D43 (`echo`), D44 (`git log --grep`), E26 (`HEAD:mainline`), E34 (текст в `-m`); F4: D29b, D49, D50 (commit в task worktree, когда `CLAUDE_PROJECT_DIR` — основной checkout на `main`);
- D48: было exit 127 (fail open), теперь exit 2.

### Проверка «не ослабляет» сверх теста

Дифференциальный fuzz (скрипт в scratchpad, вне репозитория), повторён после review на коде `050ebe2` (= файлы hook на `8d99ac1`): 26 опасных команд и для каждой 6 форм с brace/glob/extglob (`x{,}`, `{x,}`, `x*`, `x[y]`, `@(x)`, `{подкоманда,}`) — 182 ядра × 12 префиксов (в том числе `ls *.md; ` и `X={a,b} `) × до 8 суффиксов = 15 470 команд, каждая в двух каталогах: worktree на task-ветке и checkout на `main` (scratch-репозиторий, `cwd` = `CLAUDE_PROJECT_DIR`). Итого 30 940 случаев. Base блокирует, а новый пропускает — 126 случаев (63 + 63), все вида `git push origin mainx …` (ветка с префиксом `main`, намеренное исправление ложного срабатывания F5). Ни одной brace/glob-формы среди них нет. Кодов выхода, кроме 0 и 2, у нового hook нет. Первая итерация (`47c0282`): 2080 × 2 случаев, 63 расхождения того же вида.

### Что новый guard не закрывает (не хуже base)

- скрипты из файлов (`bash script.sh`, `npm run x`, Makefile), интерпретатор, читающий код из файла, обфускация (base64 и т. п.), переменные окружения, оставшиеся от предыдущих вызовов Bash;
- вычисляемое имя программы без признака git: ни `git` в тексте, ни git-подкоманды первым аргументом (`$X $Y`, `$X "$Y"`);
- **F8 (новое, вне scope):** matcher hook — только `Bash`. Инструменты GitHub MCP (например, `push_files`, `create_or_update_file`, `merge_pull_request`) пишут в репозиторий напрямую и hook не проходят. Закрывается ruleset `main` (founder) или отдельным тикетом на PreToolUse-matcher для `mcp__github__*`.
- deny-список не менялся (F6 остаётся: префиксные правила покрывают только буквальные формы; проверить их форму матчинга нельзя, пока не исправлен F1).

## Часть C. Повторные пробы в этой сессии после изменения

Сессия: облачный thread проекта, субагент в worktree, ветка `p1-01b-harness-enforcement`, HEAD `47c0282`, дерево чистое (`git status --porcelain` пусто). Время 05:15–05:20 UTC. Все пробы безвредны: несуществующие refs, `-n`, `--dry-run` при `main == origin/main == 1aa11d9`.

| # | Команда | Результат | Вывод |
|---|---|---|---|
| L01 | `echo "git reset --hard"` | вывод текста, exit 0 | NOT BLOCKED (hook не запускается: base-версия из основного checkout это блокирует) |
| L05 | `sudo -n true` | exit 0 | NOT BLOCKED (deny `Bash(sudo:*)` не применён) |
| L06 | `git reset --hard refs/heads/p1probe-does-not-exist` | exit 128, `fatal: ambiguous argument …` — отказал Git | NOT BLOCKED |
| L07 | `git clean -fdx -n` | exit 0, пусто | NOT BLOCKED |
| L10 | `git push origin main --dry-run` (GitHub) | `Everything up-to-date` | NOT BLOCKED |
| L20 | `git branch -D p1probe-does-not-exist` | exit 1, `error: branch … not found` | NOT BLOCKED |
| L21 | Edit `public/handbook.md`, несуществующая строка | `String to replace not found in file.` | NOT BLOCKED |
| L22 | `git commit -F <msg>` в task worktree | создан `47c0282` | проходит (ожидаемо) |
| — | вложенная сессия `claude -p` в scratch-репозитории с этими settings (локальный режим CLI) | вызов отклонён классификатором auto mode: `[Create Unsafe Agents]` | INCOMPLETE: живое подтверждение работы hook и deny в сессии, которая читает settings, не получено |

Пробы против scratch-репозиториев (push в `main`, commit на `main`) в этой сессии не выполнялись: изоляция worktree отклоняет git-команды, которые указывают за пределы worktree (F7 из P1-01). Эти случаи покрыты тестом.

## Часть D. Пробы для повторения founder после merge

Живые пробы — тикет #21 (решение founder). Список ниже — входные данные для него.

Выполнять в сессии, где settings применяются (thread на своём компьютере через Remote Control или облачная сессия с одним репозиторием вне Projects), в scratch-клоне с локальным bare-remote. Ожидание — сообщение `guard-git: заблокировано — …` или отказ deny:

```text
echo "git reset --hard"                     → проходит (F5)
sudo -n true                                → deny
git push origin main --dry-run              → deny + hook
git push origin HEAD:refs/heads/main --dry-run → hook
git  push  origin  main --dry-run           → hook
git -C <scratch> push origin main --dry-run → hook
git clean -fdx -n                           → deny + hook
git reset --hard refs/heads/does-not-exist  → deny + hook
git commit --allow-empty -m x  (scratch на main) → hook
git commit --allow-empty -m x  (task worktree)   → проходит
```

и проверка fail closed: временно переименовать `.claude/hooks/guard-git.sh` в scratch-клоне → любая Bash-команда блокируется с текстом `fail closed`.

## Ограничения и что не проверено

1. Живое срабатывание нового hook, deny-правил и `onFailure` в сессии Claude Code не наблюдалось (вынесено в #21): в этой среде settings репозитория не применяются (F1), вложенная сессия отклонена классификатором.
2. Противоречие страниц Settings и Projects о проектах с одним репозиторием не разрешено; число репозиториев проекта не установлено.
3. Поведение CLI старше 2.1.295 с полем `onFailure` не проверено; что обозначает `CLAUDE_CODE_VERSION=2.1.42`, не установлено.
4. Какой оболочкой Claude Code запускает command hook, по документации не уточнено; fallback проверен тестом под `sh` и `bash`.
5. Новые блоки ради fail closed (могут мешать штатной работе, все — при неизвестном итоге): git после `export PATH=…`/`alias`/`hash` в той же команде; `git push` без refspec после переключения ветки или записи config в той же команде; `git --git-dir=$X …`; вычисляемое имя программы с первым аргументом `push`/`config`/`commit` и т. п.
6. Deny-список (F6) и matcher для GitHub MCP (F8) — вне scope, follow-up.
