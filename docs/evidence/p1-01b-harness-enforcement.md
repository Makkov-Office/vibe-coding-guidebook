# Evidence P1-01b: enforcement harness в облачных сессиях и guard-hook

Тикет: [#17](https://github.com/Makkov-Office/vibe-coding-guidebook/issues/17) (P1-01b). Risk: High. Founder gate: комментарий в issue от 22.10.2026 04:28 UTC (изменение `.claude/` разрешено в рамках тикета; merge — отдельным решением founder).
Base ветки: `1aa11d9d7a08b2b768b1dcff724724ee014d5f66`; после review в ветку влит `origin/main`: `a4d1215` (P1-03 #14, P1-04 #15) merge-коммитом `66cc48c`, затем `80b066e` (P1-09 #19) merge-коммитом `8d99ac1`.
Код, к которому относятся проверки ниже: коммит `08ce6f69a351048d9596a9108a180eeb6bf3f9e9` (ветка `p1-01b-harness-enforcement`; исправление M-F4 — `b3e758b` и `08ce6f6`, между ними merge `origin/main` `5d0b6df`, P1-06 #23, коммитом `0a16ee2`). Эта редакция документа добавлена следующим коммитом и меняет только документацию. История: код `47c0282`, review на `4347f95` — NOT READY (исправления `050ebe2`); review на `2b2e740` — NOT READY (`fdbe7fe`); review на `a3cbe31` — NOT READY, одна MEDIUM (`b3e758b`, `08ce6f6`); разделы «Review …» ниже.
Дата проверок: 2026-10-22, 04:30–13:00 UTC. Входные данные: `docs/evidence/p1-01-guard-hook.md` (findings F1–F7, матрица D01–D53, пробы L01–L22) и находки review — перепроверены, а не приняты как решение.

| Файл на `08ce6f6` | sha256 |
|---|---|
| `.claude/settings.json` | `9cb0b80f40f1e092ecd7a549e113aced1d52dd80d09ce4aaa84b13344b85ac37` |
| `.claude/hooks/guard-git.sh` | `62d79cf12d71fc65f3b1f85034727b0ff913edb4960d7df5f63e667933d80b7e` |
| `.claude/hooks/guard_git.py` | `5b2b0190efa3b4c3970a8cd7cc76a62dc5127f8c0000b59a22754dc73acb7538` |
| `tests/guard-git.test.mjs` | `ef35bfdff323d9a26f1b94d56646552c2e6a09ff1acf14de400490746c2b7f11` |
| `tests/fixtures/guard-git.base-1aa11d9.sh` (копия hook с base) | `b1d3439eddfd1637bf9e75ef8796cba6945c6174ae47ed294f208ec852a3e6bc` (совпадает с P1-01) |

## Итог

| Acceptance criterion (#17) | Результат | Основание |
|---|---|---|
| Пробы L01–L22 в живой облачной сессии: BLOCKED там, где ожидается; commit в task worktree проходит | **BLOCKED → вынесено в #21** | Решение founder: AC1 (живые пробы) вынесен в отдельный тикет #21, в этом PR живые пробы не требуются. Причина BLOCKED: в облачном thread'е Claude Code Projects permission rules и hooks из `.claude/settings.json` репозитория не применяются (документация, раздел F1). Это свойство среды, из репозитория не включается. Повторные пробы в этой сессии после изменения — по-прежнему NOT BLOCKED (часть C). Проба во вложенной локальной сессии `claude -p` отклонена классификатором auto mode (`[Create Unsafe Agents]`). Commit в task worktree проходит (`47c0282`) |
| Регрессионный тест матрицы в CI зелёный | **PASS** | CI (P1-04, #15 в `main`): run `39760750479`, head `08ce6f6` — success (`npm ci`, `npm run validate`, включая `npm test`); CI на HEAD с этой редакцией документа — в теле PR. Свежий clone `08ce6f6`: `npm test` 253/253, `npm run validate` PASS |
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

Конструкция (решение оркестратора после review `2b2e740`): **подстрочные правила base-hook (`1aa11d9`) применяются к сырому тексту каждой строки всегда** — без исключений для «чистых» строк, инертных программ и текста в `-m`. Анализатор `guard_git.py` только добавляет блоки поверх (union). Поэтому «ничего из того, что блокировал base, не проходит» верно по построению; единственное намеренное отличие — F4: правило commit/merge/rebase/cherry-pick проверяет ветку репозитория из `cwd` payload; `CLAUDE_PROJECT_DIR` проверяется **дополнительно**, если в строке есть программа, которую анализатор не разбирает (интерпретатор `python3`/`node`/`perl`…, `npm`, скрипт `bash run.sh`, `sh` без `-c`, `find`, `test -v`, вычисляемое имя программы, git с подкомандой, которой нет среди встроенных, — она запускает внешнюю `git-<sub>`): такая программа может сменить каталог. Блок — если любой из каталогов на `main` или ветку не определить. Если в строке только git и «прозрачные» программы (`cd`, `echo`, `ls`, `cat`, `[ … ]` без `-v` и т. п.), `CLAUDE_PROJECT_DIR` не проверяется — так commit в task worktree проходит, когда сессия стартовала в основном checkout на `main`. Ложные срабатывания base (F5: текст в `echo`/`grep`/`-m`, ветки `main<суффикс>`, `HEAD:mainline`) сохранены намеренно; их исправление — follow-up (тикет заведёт оркестратор).

Анализатор разбирает команду, а не ищет подстроки:
- токенизация: кавычки, экранирование, `;` `&&` `||` `|` `&` перевод строки, скобки, комментарии, перенаправления, heredoc, `$(...)` и обратные кавычки (анализируются рекурсивно);
- снятие обёрток (`env`, `sudo`, `timeout`, `nice`, `nohup`, `time`, `command`, `exec`, `xargs`, `find -exec`, `watch`), рекурсивный разбор `bash -c`/`sh -c`, `eval`, `env -S`, git alias (`-c alias.*` и из config репозитория), `rebase --exec`, `bisect run`, `submodule foreach`;
- git: глобальные опции `-C`, `-c`, `--git-dir`, `--work-tree`; push — refspec с `+`, `refs/heads/`, `HEAD`/`@`, удаление, шаблоны, `--all`/`--branches`/`--mirror`/`--prune`, сокращения длинных опций — любой префикс опасной опции считается ею (`--h`, `--de`, `--forc`, `--f`, `--m`; неоднозначное сокращение git отвергнет сам), неявное назначение (`push.default`, upstream, `remote.*.push`), `remote.<name>.mirror` (из `-c` и config — блок любого push), `remote.<name>.push` при refspec без `:` — блок; `reset --hard`; `clean` — разрешён только dry-run без force; `branch -D`/`--delete --force`; `worktree remove -f/--force`;
- ветка для commit/merge/rebase/cherry-pick/revert/am — по полю `cwd` payload, затем `cd`/`pushd`/`env -C`/`sudo -D`/`git -C` внутри команды и `checkout`/`switch` раньше в той же команде; `CLAUDE_PROJECT_DIR` — только для правила base при непрозрачной программе в строке (F4, выше). Неизвестный каталог, не-репозиторий, вычисляемый путь, изменение `GIT_*` в команде → блок (fail closed);
- динамические слова: `$var`, `$(...)`, brace expansion (`{a,b}`, `{1..3}`), glob (`*`, `?`, `[...]`), extglob (`@(...)`) — значение известно только при выполнении. Динамические подкоманда git, глобальная опция, любой аргумент push, опции `reset`/`clean`/`branch`/`worktree` → блок;
- состояние внутри одного вызова Bash (общее и для `bash -c`, alias, `$(...)`): `checkout`/`switch`, `branch -m/-M/-c/-C`, `symbolic-ref HEAD …` раньше в команде добавляют ветки-кандидаты для commit/merge/… и для `push HEAD`/`@`; запись `git config`, upstream (`branch -u`, `--track`, `push -u`, создание ветки), `git remote` раньше в команде → push без refspec и неизвестный alias блокируются;
- git, который запускает сам hook (`symbolic-ref`, `config --get`), — абсолютный путь из PATH самого hook. Из переменных команды проходят только `GIT_DIR`, `GIT_WORK_TREE`, `GIT_COMMON_DIR`, `GIT_CONFIG*`, `HOME`, `XDG_CONFIG_HOME`. Если команда меняет `PATH`, `LD_*`, `DYLD_*` (префикс, `env`, `export`, `+=`) — блок без запуска git;
- вычисляемое имя программы (`$(printf git) push …`, `${GIT:-git}`, `{git,x}`) → блок, если в нём есть `git` или первый аргумент — git-подкоманда из списка опасных (push, reset, clean, branch, worktree, checkout, switch, config, commit, merge, rebase и др.);
- аргументы git с пробелами (включая значения `-m`, `--grep`) анализируются как команды: редактор (`GIT_EDITOR=sh`, `core.editor`) может их исполнить;
- `$'…'` учитывает `\'`; `${…}` учитывает кавычки, а `$(...)` и обратные кавычки внутри анализируются.

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

### Review 2b2e740: находки и исправления

Воспроизведено до исправления (те же scratch-пробы, base и hook `2b2e740`): H1 — 6 форм base block → new allow; H2 — 9 форм base block → new allow; M1 — 4 формы и M2 — 2 формы пропускали оба; L1 — блок на checkout `main`; L2 — `git push origin main:feature`, `git push origin x; grep -f pat file`: base block → new allow.

| # | Находка | Исправление (`fdbe7fe`) | Тесты |
|---|---|---|---|
| H1 HIGH | `${…}` и `$'…'` не делали строку «нечистой»; `$'…'` не учитывал `\'`, `${…}` — кавычки | правила base безусловны (класс закрыт); сканирование `$'…'` и `${…}` исправлено, `$(...)` внутри `${…}` анализируется | R01–R07 |
| H2 HIGH | waiver для инертных программ (`printf -v`, `test -v`, `sort -o`, `rg --pre`, `--compress-program`) и для текста `-m` при `GIT_EDITOR=sh` / `core.editor=sh` / `GIT_SEQUENCE_EDITOR=sh` | waiver удалён: правила base безусловны; значения `-m`/`--grep` анализируются как команды | R10–R19 |
| M1 MEDIUM | сокращения длинных опций (`--h`, `--de --forc`, `--f`, `--m`) | любой префикс опасной опции (reset `--hard`; clean/branch/worktree/push `--force`; branch/push `--delete`; push `--mirror`/`--all`/`--branches`/`--prune`) | R20–R25 |
| M2 MEDIUM | назначение push из `remote.<name>.push` / `remote.<name>.mirror` | `git config --get-regexp` с `-c` команды: mirror → блок; push-mapping (или запись `remote.*` раньше в команде) + refspec без `:` → блок | R30–R35 |
| L1 LOW | `git switch -c y && git push -u origin HEAD` блокируется с checkout на `main` | не исправлено: известное ложное срабатывание (кандидаты HEAD — текущая ветка плюс переключения) | L1 (ожидание block) |
| L2 LOW | в evidence fuzz-расхождения — «только mainx», а их больше | правила base безусловны: расхождений нет (fuzz ниже); формы ревьюера в дифференциальном корпусе | X-mainfeature2, X-grepf |

### Review a3cbe31: находка и исправление

M-F4 (MEDIUM): правило base для commit проверяло только репозиторий из `cwd`. При `cwd` = task worktree и `CLAUDE_PROJECT_DIR` = основной checkout на `main` строка с интерпретатором, который сам меняет каталог, проходила; base её блокировал (по `CLAUDE_PROJECT_DIR`), и коммит попал бы в `main`. Fuzz в прошлой редакции шёл с `cwd` = `CLAUDE_PROJECT_DIR` и этот случай не видел.

Воспроизведено до исправления (пробы, base и `a3cbe31`, `cwd` = task, `CLAUDE_PROJECT_DIR` = main): `python3 -c "…os.chdir('<main>'); os.system('true; git commit …')"`, тот же сценарий через `node -e` и `perl -e`, `$RUNNER sh -c 'cd <main> && git commit -m x'`, `bash run.sh; git commit -m x`, `find <main> -maxdepth 0 -execdir git commit -m x \;` — base block, new allow.

Исправление (`b3e758b`; `08ce6f6` — по результату fuzz ниже: внешняя git-подкоманда `git -C /tmp python3 -c …` тоже непрозрачна): если правило совпало и в строке есть непрозрачная программа, проверяется и `CLAUDE_PROJECT_DIR`; `CLAUDE_PROJECT_DIR` не задан или не абсолютный → блок. Вычисляемая программа-обёртка (`$RUNNER …`) — её аргументы анализируются как команда в неизвестном каталоге: `$RUNNER sh -c "git commit -m x"` блокируется и при `cwd` = `CLAUDE_PROJECT_DIR` = task (base его пропускал).

Тесты: F01–F11 block, F12 и F20–F25 allow; новый дифференциальный тест «cwd = task worktree, CLAUDE_PROJECT_DIR = основной checkout»: по всему корпусу base block → new allow допускается только для строк, которые независимый оракул в тесте признаёт прозрачными (головы сегментов из фиксированного списка, без `$`/обратных кавычек и `-v`); контроль — такие расхождения есть. Оракул знает обёртки, которые не меняют каталог (`timeout N`, `env` без `-C`/`-S`, `nice`, `nohup`, `time`, `command`).

### Регрессионный тест (`tests/guard-git.test.mjs`, в `npm test`)

Временная структура как в CLAUDE.md: основной checkout на `main`, worktree на task-ветке, worktree с upstream `main`, detached worktree, каталог без git; изолированный git config. Команды передаются hook в payload и не исполняются.

| Группа | Случаи | Результат на `08ce6f6` |
|---|---|---|
| Матрица P1-01 | D01–D53: D11 и D12 — в обоих условиях (a/b/c), D29 — в обе стороны, D32/D33/D49/D50 — с разными `CLAUDE_PROJECT_DIR` | PASS |
| Обходы и fail closed | E01–E72 | PASS |
| Review 4347f95 | B01–B35 (brace/glob), S01–S26 (состояние в команде), P01–P11 (PATH/LD_*), C01–C10 (вычисляемое имя) | PASS |
| Review 2b2e740 | R01–R35 (H1, H2, M1, M2), L1 | PASS |
| Review a3cbe31 | F01–F25 (M-F4, `cwd` ≠ `CLAUDE_PROJECT_DIR`) | PASS |
| D46/D47, D48 и одно сообщение при блоке (`sh` и `bash`), settings, нет python3, нет/падает анализатор, fake git в PATH | 11 тестов | PASS |
| Дифференциальный тест против base-hook (fixture) | весь корпус выше (включая B/S/P/C/R и формы L2) в двух каталогах (`cwd` = `CLAUDE_PROJECT_DIR`): всё, что блокировал base, блокируется и сейчас — **без исключений**; третья конфигурация `cwd` = task, `CLAUDE_PROJECT_DIR` = main: исключения только F4 для прозрачных строк (оракул) | PASS |
| Всего `npm test` (content 7 + guard 246) | 253 | PASS (свежий clone `08ce6f6`, `npm ci`; CI run `39760750479`) |

Изменения ожидания по сравнению с P1-01 (все — по тексту findings):
- было ALLOW, теперь BLOCK — 19 безусловных обходов F3 (D03–D05, D07–D09, D15, D17, D18, D20, D21, D25–D27, D30, D31, D37, D39, D51) и условные D11b/c, D12b;
- было BLOCK, теперь ALLOW — только F4: D49, D50, F12, F20–F23, F25 (commit в task worktree, когда `CLAUDE_PROJECT_DIR` — основной checkout на `main`, а в строке нет непрозрачных программ);
- известное ложное срабатывание, как в base: F07 `npm test && git commit -m x` при `CLAUDE_PROJECT_DIR` на `main` — разбить на два вызова;
- ложные срабатывания F5 — D42 (`maintenance`), D43 (`echo`), D44 (`git log --grep`), E26 (`HEAD:mainline`), E34 (текст в `-m`) — остаются BLOCK, как в base (follow-up). D29b (`cd <task> && git commit` из checkout на `main`) — BLOCK: правило base проверяет ветку по `cwd` payload; известное ложное срабатывание;
- D48: было exit 127 (fail open), теперь exit 2.

### Проверка «не ослабляет» сверх теста

Дифференциальный fuzz (скрипт в scratchpad, вне репозитория) на коде `08ce6f6`.

Корпус:
- 30 опасных команд: команды прошлой редакции, плюс `git push origin main:feature`, `git push origin x`, форма H1 `echo $'\'' ; git push origin main # '` и `python3 -c "import os; os.chdir('<main>'); os.system('true; git commit -m x')"`;
- для каждой — 6 форм с brace/glob/extglob, всего 210 ядер;
- 16 префиксов, в том числе `npm test && `, `python3 x.py; `, `$RUNNER `, `bash run.sh; `;
- до 6 суффиксов;
- три конфигурации каталогов: (а) `cwd` = `CLAUDE_PROJECT_DIR` = task worktree, (б) `cwd` = `CLAUDE_PROJECT_DIR` = checkout на `main`, (в) `cwd` = task worktree, `CLAUDE_PROJECT_DIR` = checkout на `main`.

Итого **51 030 случаев**:
- в (а) и (б) base блокирует, а новый пропускает — **0**;
- в (в) — 900 случаев, и все признаны намеренным F4 тем же оракулом, что и в тесте (строки только из git и прозрачных программ, например `timeout 9 git commit -m x`, `git commit -m x ; ls`); неожиданных расхождений — **0**.

Коды выхода нового hook — только 0 и 2.

Первый прогон этой конфигурации на `0a16ee2` дал 228 неожиданных случаев. 200 из них — `timeout 9 git …` и `env git …`: обёртки, которые не меняют каталог; это ошибка оракула, он исправлен. 28 — `git -C /tmp python3 -c "…chdir(<main>)…git commit…"`: внешняя git-подкоманда; это настоящий пропуск, исправлен в `08ce6f6` (тест F11).

Предыдущая редакция (`fdbe7fe`, только `cwd` = `CLAUDE_PROJECT_DIR`): 39 382 случая, 0 расхождений.

L2, точный список расхождений на прошлых итерациях (теперь закрыты безусловными правилами base):
- `2b2e740`, fuzz 30 940 случаев: 126 расхождений, все `git push origin mainx …` (63 в task worktree + 63 на `main`; префиксы и суффиксы корпуса); fuzz не содержал форм ревьюера, поэтому вывод «только mainx» был неполным;
- `2b2e740`, формы ревьюера (воспроизведены пробой): `git push origin main:feature` и `git push origin x; grep -f pat file` — base block, new allow; а также все формы H1 и H2 (раздел «Review 2b2e740»);
- `47c0282`, fuzz 2080 × 2 случаев: 63 расхождения `git push origin mainx …`.

### Что новый guard не закрывает (не хуже base)

- скрипты из файлов (`bash script.sh`, `npm run x`, Makefile), интерпретатор, читающий код из файла, обфускация (base64 и т. п.), переменные окружения, оставшиеся от предыдущих вызовов Bash;
- вычисляемое имя программы без признака git: ни `git` в тексте, ни git-подкоманды первым аргументом (`$X $Y`, `$X "$Y"`);
- **follow-up F5:** ложные срабатывания правил base (текст в `echo`/`grep`/`-m`, ветки с префиксом `main`, `HEAD:mainline`) сохранены, чтобы правила base оставались безусловными;
- **известные ложные срабатывания fail closed:** L1 (`git switch -c y && git push -u origin HEAD` с checkout на `main`), D29b; git после `export PATH=…`/`alias`/`hash` в той же команде; push без refspec после переключения ветки или записи config; refspec без `:` после записи `remote.*`; `git --git-dir=$X …`; push, когда каталог не существует (config не прочитать).
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
7. Ложные срабатывания F5 сохранены намеренно (правила base безусловны) — follow-up; L1 и D29b — известные ложные срабатывания.
8. F4: строка с commit/merge/rebase/cherry-pick и непрозрачной программой (например `npm test && git commit`) при `CLAUDE_PROJECT_DIR` на `main` блокируется, как в base (F07). Вычисляемая программа-обёртка (`$RUNNER git …`) анализируется в неизвестном каталоге, поэтому push и commit через неё блокируются.
