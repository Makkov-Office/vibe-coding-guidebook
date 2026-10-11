# Claude Code: исследовательская карта для обзора

Проверено 11 октября 2026. Только официальные документы, help center, объявления и репозиторий Anthropic. Это рабочие заметки для редактора, не отдельный публикуемый учебный источник. Формулировки ниже — пересказ; не копировать документацию большими фрагментами. У каждой страницы web-источника лимит пересказа 200 слов; при подготовке публичного материала распределять подробности между отдельными страницами, не раздувать один источник.

## 1. Проверка свежести

- Последний опубликованный GitHub release — **v2.1.296 от 9 октября 2026**: [release](https://github.com/anthropics/claude-code/releases/tag/v2.1.296).
- [Полный CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md) также начинается с 2.1.296. В нём есть новые настройки subagent auto-compaction и многочисленные исправления permissions, MCP, Remote Control, gateway, Windows и UI. Это подтверждение актуальности версии, а не повод перечислять все bug fixes читателю.
- [Help center release notes](https://support.claude.com/en/articles/12138966-release-notes) подтверждают Haiku 5.5 и ежемесячные API credits 7 октября; Sonnet 5.5 — 28 сентября.
- [Каталог product announcements](https://claude.com/resources/product-announcements) содержит Mods 1 октября, Haiku 5.5 7 октября и выход Docs/Slides/Design из beta 8 октября. Weekly digest в docs отстаёт: последняя видимая неделя 37; не использовать его как единственное доказательство свежести.

## 2. Что представляет собой продукт

Источник: [Overview](https://code.claude.com/docs/en/overview), проверено 2026-10-11; статус: документированная основная возможность.

Claude Code читает репозиторий, меняет несколько файлов, запускает команды и работает с инструментами разработки. Это агентный рабочий процесс с реальным checkout, diff и проверкой результата. Поверхности: CLI, VS Code, JetBrains, Desktop Code tab, web/cloud и mobile. Возможности и аутентификация различаются; нельзя обещать одинаковый набор на каждой поверхности. CLI/VS Code/JetBrains поддерживают также API и сторонние model providers. Desktop имеет visual diff, несколько сессий и cloud tasks. API не превращает всю cloud/mobile инфраструктуру в доступную автоматически.

## 3. Подписки и цены

Источник: [Pricing](https://claude.com/pricing), проверено 2026-10-11. USD, без налогов, цены могут измениться.

| План | Claude Code | Цена и существенная разница |
| --- | --- | --- |
| Free | Не включён | $0; Claude chat/Artifacts не означают доступ к Code |
| Pro | Включён | $20/месяц или $200/год; официальный экран округляет годовую цену до $17/месяц |
| Max 5x | Включён | $100/месяц; 5x allowance Pro |
| Max 20x | Включён | $200/месяц; 20x allowance Pro |
| Team Standard | Включён | $25/seat monthly, $20/seat/month annual; Team 2–150 человек |
| Team Premium | Включён | $125 monthly, $100 annual; 5x Standard |
| Enterprise | Включён | $20/seat/month annual **плюс всё использование по API rates** |

Лимит зависит от модели, контекста, сложности и инструментов; фиксированное число запросов не обещать. У paid есть пятичасовые окна и недельные ограничения, могут добавляться другие caps. Claude и Code используют общий allowance. API PAYG — отдельная схема оплаты, не подписка Pro/Max. Fable на Pro требует usage credits; Max и Team Premium имеют отдельные ограничения семейства.

## 4. Что изменилось в Team/Enterprise

Источники: [Team/Enterprise Code access](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan), [Enterprise plan](https://support.claude.com/en/articles/9797531-what-is-the-enterprise-plan), проверено 2026-10-11.

На **каждом Team seat**, включая Standard, Code уже включён. Старое утверждение «только Premium» неверно. Новая Enterprise схема — один seat type, fee за доступ, usage отдельно; token allowance в seat fee не входит, администратор задаёт user/org spend limits. Legacy Enterprise Chat/Chat+Code или Standard/Premium ещё могут существовать до продления договора. На legacy проверять назначенный seat, не переносить новую модель на старый контракт. Точную доступность cloud и preview также проверять в настройках организации: часть docs всё ещё использует legacy названия seats.

## 5. API credits и extra usage — разные кошельки

Источник: [Monthly API credits for Max and Team](https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans), проверено 2026-10-11; rollout объявлен 7 октября.

Max 5x получает $100, Max 20x $200 API credits за billing cycle. Team: $20 Standard/$100 Premium per seat, единый pool максимум $500/month. Надо связать Console organization; offer постепенно появляется после семи дней eligible plan. Credits истекают, не переносятся.

Они предназначены для собственного API/SDK-продукта и **не оплачивают interactive Claude Code или extra usage**. Самостоятельно запущенные `claude -p`/Agent SDK с API key связанной Console org покрываются; те же команды с Claude subscription login расходуют allowance. GitHub Action, IDE extension и Desktop runs классифицируются как Code usage и этим бонусом не покрываются. Не путать с отдельными платными usage credits для продолжения Code после лимита.

Дополнительный источник оплаты: [Manage usage credits](https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans). Когда included session/weekly limit закончился, можно продолжать с usage credits по тарифам потребления; включать это осознанно со spend cap.

## 6. Практический старт и проверка оплаты

Источник: [Pro/Max setup](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan), проверено 2026-10-11.

Для подписки войти тем же Claude account. `/login` меняет метод входа, `claude update` обновляет CLI, `/status` помогает проверить account/provider. `ANTHROPIC_API_KEY` может переключить аутентификацию на API billing вместо подписки. Нельзя обещать, что установленный Pro автоматически оплатит все запуски с экспортированным API key.

Установка Windows из [Overview](https://code.claude.com/docs/en/overview): `winget install Anthropic.ClaudeCode`; затем `claude --version`, перейти в проект и `claude`. Native install auto-updates; WinGet требует `winget upgrade Anthropic.ClaudeCode`. Не включать длинные установки для всех OS в основной текст: дать короткий Windows старт и official setup link.

## 7. Модели, effort и контекст

Источник: [Model configuration](https://code.claude.com/docs/en/model-config), проверено 2026-10-11.

Anthropic API aliases сейчас: `opus`→Opus 5.5, `sonnet`→Sonnet 5.5, `haiku`→Haiku 5.5. `default` для Pro/Max/Team/Enterprise/API — Opus 5.5 на текущей версии, если settings/admin не задают другое. На provider clouds aliases могут указывать на старые версии.

Fable 5.1 доступен через `/model fable`; это отдельный выбор для длинных сложных задач, не default. Может требовать usage credits. В Claude apps gateway alias может разрешаться в Fable 5. Не обещать одинаковую Fable доступность всем seats.

`/model` выбирает модель, `/effort` — effort. `opusplan` использует Opus для плана, затем Sonnet для исполнения. Новые Opus/Sonnet имеют native 1M context; контекст не равен постоянной памяти, auto-compaction всё равно сжимает длинный диалог. Для воспроизводимости version pin, для обычного пользователя alias и проверка `/status`. Minimum CLI: Opus 5.5 2.1.280, Sonnet 5.5 2.1.284, Haiku 5.5 2.1.293.

## 8. Fast mode

Источник: [Fast mode](https://code.claude.com/docs/en/fast-mode), проверено 2026-10-11; **research preview**.

`/fast` включает ускоренную конфигурацию того же Opus, не другую модель. Поддерживаются Opus 5.5/5/4.8, не Sonnet/Haiku. Это lower latency и higher per-token cost; полезно для коротких итераций и live debugging. На подписках расходует **только отдельные usage credits**, даже если allowance не закончился. Team/Enterprise Owner должен разрешить функцию. API Console нужна provisioned access; cloud providers Bedrock/Google/Foundry не поддерживают. Opus 5.5 fast: $8 input/$40 output за миллион tokens. Не делать fast default в учебном рецепте. Effort и fast — независимые настройки; снижение effort меняет объём рассуждения, fast приоритет обслуживания.

## 9. План, approvals и sandbox

Источник: [Permission modes](https://code.claude.com/docs/en/permission-modes), проверено 2026-10-11.

`/plan` или `claude --permission-mode plan` исследует код и предлагает план до edits. `Shift+Tab` переключает режим в CLI. Plan допускает read-only/classifier-approved commands, не обещать абсолютное отсутствие любых действий.

Manual (`default`/`manual`) спрашивает перед действиями; Accept edits заранее допускает file edits; Auto использует background classifier; DontAsk отвергает непредодобренные действия. На CLI/VS Code >=2.1.283 Auto — starting default с оговорками settings/provider/availability. Это не «полный доступ без проверки». Bypass не рекомендовать новичку; контейнер/VM нужен для unattended workflows.

Источник: [Sandbox](https://code.claude.com/docs/en/sandboxing). `/sandbox` ограничивает shell-команды средствами OS: macOS, Linux, WSL2; **native Windows без этого sandbox**. File tools, hooks, MCP и mods этой оболочкой не изолируются. Permissions управляют разрешением действия, sandbox — тем, куда уже разрешённое действие доберётся.

## 10. Инструкции и память

Источник: [Memory](https://code.claude.com/docs/en/memory), проверено 2026-10-11.

`CLAUDE.md` — ваши команды сборки, соглашения и границы проекта. `.claude/rules/` задаёт более узкие правила, в том числе по paths. `/init` предлагает starter; `/memory` редактирует настройки памяти, `/context` показывает реально загруженные memory files. Claude Code теперь поддерживает `AGENTS.md` через встроенную возможность с условиями: не писать, что он всегда игнорируется или всегда равнозначен CLAUDE.md.

Auto memory — заметки Claude о предпочтениях и corrections, per repository, shared across worktrees. Это редактируемый контекст, **не гарантированная enforced policy**. Security boundary задавать permissions/hooks. `/doctor prompt-audit` (>=2.1.283) ищет устаревшие/противоречивые инструкции и показывает proposals, не применяет edits до просьбы пользователя.

## 11. Skills и reusable app checks

Источник: [Skills](https://code.claude.com/docs/en/skills), проверено 2026-10-11.

`.claude/skills/<name>/SKILL.md` задаёт workflow; можно вызвать `/<name>` или автоматически по релевантности. Personal skills находятся в `~/.claude/skills/`, project skills коммитятся вместе с repo; account synced skills имеют отдельный scope. Они загружаются по необходимости, не заменяют весь CLAUDE.md.

Bundled `/run`, `/verify`, `/run-skill-generator` запускают приложение и проверяют поведение. `/verify` подтверждает результат на running app, а не только typecheck/tests; специальную процедуру можно записать как project skill. `/run-skill-generator` фиксирует рабочую launch recipe для последующих агентов. Для новичка полезно: «проверь экран на 360px, воспроизведи пользовательский сценарий, покажи evidence». Возможность не означает доступность любого браузера/GUI без настройки.

## 12. Plugins, code intelligence и Mods

Источник: [Plugins overview](https://code.claude.com/docs/en/plugins/overview). Plugin упаковывает skills, agents, hooks, MCP и другие компоненты; marketplaces позволяют установить один повторяемый набор. `/plugin` управляет ими; scopes различаются. Это исполняемые расширения, не просто текстовая подсказка.

Источник: [Code intelligence](https://code.claude.com/docs/en/plugins/code-intelligence). LSP plugin даёт symbol navigation, references и diagnostics после edits; нужно установить соответствующий language server. Полезно при больших TypeScript проектах, но не обещать встроенную поддержку всех языков без зависимостей.

Источник: [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview), проверено 2026-10-11; введены в публичные docs, CLI >=2.1.287, Desktop runtime >=2.1.286.

Mods — JS/TS event handlers в plugin: собственная панель, команда, tool-call guard, оформление interface. UI рисуется в CLI/Desktop; VS Code/cloud/headless могут выполнить hooks, но не показывают panes. Mods не sandboxed и работают с user permissions; доверие к автору обязательно. Новичку достаточно обзора и примеров «счётчик контекста / видимый diff», не большого шаблона исполнения.

## 13. MCP и hooks

Источник: [MCP](https://code.claude.com/docs/en/mcp). Это доступ к внешним tools/data, а не дополнительные знания модели сами по себе. HTTP preferred; локальный stdio также поддерживается. Проверенные commands: `claude mcp add --transport http notion https://mcp.notion.com/mcp`, `claude mcp list`, `/mcp`. OAuth, scopes, approvals и отдельные credentials потребуются. Project `.mcp.json` не может сам себе дать trust. Claude Desktop config и standalone CLI не обязаны совпадать.

Источник: [Hooks guide](https://code.claude.com/docs/en/hooks-guide). Hooks автоматически запускают scripts/HTTP/prompt logic на lifecycle events: форматирование после edit, защита перед tool call, notification по завершении. `PreToolUse` может блокировать действие детерминированной проверкой. В отличие от skill это реакция на событие, не workflow по запросу. Hooks — исполняемый код, избегать установки непроверенных чужих scripts.

## 14. Subagents, teams и workflows

Источник: [Subagents](https://code.claude.com/docs/en/sub-agents). Worker имеет собственный context, tools/model/instructions; полезен для repo exploration, независимого review или исследования. Foreground блокирует до результата, background идёт одновременно; approvals приходят в main session. `/tasks` показывает работу. Custom definitions — `.claude/agents/`, `/agents` помогает создавать. Не обещать бесплатное параллелирование: tokens/allowance расходуются.

Источник: [Agent teams](https://code.claude.com/docs/en/agent-teams); **experimental**, off by default. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` включает координацию peer sessions, shared tasks и messaging. Desktop coordinated teams не поддерживает. One team/session, no nested teams, resumption ограничен; для обычного feature не включать по умолчанию.

Источник: [Dynamic workflows](https://code.claude.com/docs/en/workflows). JS runtime orchestration держит intermediate state в script, допускает много workers и repeatable cross-check. Paid/API/provider access; Pro включает из `/config`. `/deep-research` и `/workflows` — проверенные команды. Полезно для большой миграции/аудита, а не каждого CSS изменения.

## 15. Background agents и worktrees

Источник: [Agent view](https://code.claude.com/docs/en/agent-view); **research preview**.

`claude agents` — панель нескольких полных local sessions, `claude --bg` запускает background session. Можно читать status, открыть, направить сообщение, увидеть Needs input. Сессия живёт на вашей машине; shutdown её останавливает, это не cloud. Параллельные sessions быстрее расходуют allowance. Для isolation использовать worktree, не отдавать нескольким writers одни файлы.

Источник: [Worktrees](https://code.claude.com/docs/en/worktrees). `claude --worktree feature-name` даёт отдельную рабочую директорию/ветку. `.worktreeinclude` помогает с нужными gitignored local files. Это изоляция checkout, не автоматическая независимость API/contracts; merge/review остаётся явным шагом. Репозиторий должен иметь первый commit. Не обещать, что .env всегда сам переносится.

## 16. Undo, checkpoints и сохранение диалога

Источник: [Checkpointing](https://code.claude.com/docs/en/checkpointing).

`/rewind` или Esc Esc позволяет вернуть conversation/code checkpoint либо summarise нужную часть. **Не заменяет Git.** Shell file operations, внешние edits и большинство subagent edits не возвращаются этим механизмом; symlink/hardlink paths пропускаются. Для экспериментальной UI итерации полезно, но snapshot/commit остаётся надёжной границей.

Источник: [Sessions](https://code.claude.com/docs/en/sessions). `/resume`/`claude --continue` возвращают локальную историю; `/branch` сохраняет исходную conversation для другой идеи. `/fork` — отдельный background session, не то же самое. `/compact` с фокусом на contracts и unresolved tasks поддерживает длинный процесс; после compaction критичные instructions лучше иметь в repo.

## 17. Desktop и браузерная проверка

Источник: [Desktop](https://code.claude.com/docs/en/desktop), проверено 2026-10-11.

Code tab: local/SSH/cloud sessions, side-by-side panes, visual diff, integrated terminal/file editor, preview app и PR monitoring. Browser pane использует **чистый отдельный профиль**, Chrome extension — ваш logged-in браузер. Это важное различие для auth testing. Desktop Linux beta; Computer Use на Linux отсутствует. Coordinated agent teams есть в CLI, не Desktop. Не описывать autocomplete как фичу Desktop: работа conversational + explicit edits.

Источник: [Chrome](https://code.claude.com/docs/en/chrome). `claude --chrome`, `/chrome`; Chromium browser, Claude in Chrome extension >=1.0.36 и Pro/Max/Team/Enterprise subscription login. Не API-key/provider-only session. Позволяет реальные клики, screenshots, console/network debug и UX verification с site permissions. General availability подтверждена [week27](https://code.claude.com/docs/en/whats-new/2026-w27) от 29 июня–3 июля.

Источник: [CLI Computer use](https://code.claude.com/docs/en/computer-use); **research preview**, Pro/Max, macOS interactive CLI, не `-p`, не Team/Enterprise. Desktop также macOS/Windows, off by default. Это actual screen/apps; не смешивать с browser-only inspection.

## 18. Projects — новая координация длительной работы

Источник: [Claude Projects](https://code.claude.com/docs/en/claude-projects), проверено 2026-10-11; **public beta, gradual rollout, Pro/Max**, не Team/Enterprise.

Одна ongoing conversation принимает связанные задачи и координирует parallel threads с общими repos, instructions/memory. Threads обычно cloud; local-only resources доступны через Remote Control. Web/Desktop/mobile, не CLI/VS Code/JetBrains. Полезно для нескольких связанных bugs или API+web+mobile migration. Не смешивать с обычными Chat Projects, папкой Desktop или agent teams. Если нет пункта в UI, аккаунт ещё не получил rollout.

Источник объявления: [Projects redesigned](https://claude.com/blog/projects-redesigned), **17 сентября 2026**, подтверждает beta и новую coordinator model. Использовать короткую ссылку «что нового», а не переносить marketing claims.

## 19. Remote Control и Cloud — принципиальная граница

Источник: [Remote Control](https://code.claude.com/docs/en/remote-control).

`/remote-control`/`claude remote-control` — окно в local session с телефона/web. Local files/MCP доступны, но компьютер и процесс должны работать. Pro/Max/Team/Enterprise, Owner enablement у org; API keys, provider-only и custom gateway не поддерживаются. Открытие mobile не переносит вычисления на сервер.

Источник: [Cloud sessions](https://code.claude.com/docs/en/claude-code-on-the-web).

Web/mobile/Desktop/`claude --cloud` запускают отдельный cloud checkout, работа идёт после закрытия ноутбука. `claude --teleport` получает branch+history обратно в local checkout с требованиями same repo/account, clean git state и pushed branch. Последующие local сообщения не синхронизируют cloud copy автоматически. Repo access/setup scripts/network policy готовятся отдельно. Нет отдельной цены VM, usage берётся из plan; API/provider authentication имеет отдельные ограничения. Документ доступности Enterprise ещё называет legacy seats — не обещать cloud любой Enterprise configuration.

## 20. Artifacts, дизайн и presentation

Источник: [Artifacts](https://code.claude.com/docs/en/artifacts).

Из output session можно сделать live interactive page на private claude.ai URL, показать annotated diff, UI варианты, dashboard или investigation timeline. Share нужно выбрать отдельно. Pro/Max/Team/Enterprise и Claude subscription login; API-only не даёт этой publishing поверхности. Artifact — self-contained single page без своего backend и multi-route hosting. Поэтому preview/report полезен для vibe coding, а production app требует отдельного deploy.

`/design <brief>` делает editable artboards в canvas; `/slides <brief>` — презентацию. Docs integration использует connector, не выдумывать `/docs`. Документация Artifacts всё ещё называет templates beta. Более свежий [официальный announcement catalog](https://claude.com/resources/product-announcements) 8 октября сообщает Docs/Slides/Design **out of beta** в Claude apps: явно различать статус продукта и Code template integration, не расширять Free chat support до Free Claude Code.

## 21. Три вида scheduling

Источник: [Routines](https://code.claude.com/docs/en/routines). Cloud routine работает при выключенном компьютере, triggers: schedule/API/GitHub. Pro/Max/Team/Enterprise, org может отключить. `/schedule` создаёт routine из local CLI subscription session, в cloud-session этот command не доступен; web UI работает. Runtime клонирует repo и uses configured connectors, не получает весь local environment автоматически.

Источник: [Desktop scheduled tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks). Local task доступен в Routines Desktop, persistent across restart, но запускается лишь при открытом app и awake machine. Пример полезного workflow: review вчерашних изменений, dependency audit; не создавать speculative unattended production actions.

Источник: [Goal](https://code.claude.com/docs/en/goal). `/goal` задаёт observable completion condition; Claude продолжает до успеха/невозможности/error. Это sustained task execution, не календарное событие. `/loop` повторяет prompt внутри живой session; нельзя обещать выполнение после shutdown. Для polling CI подходит loop; для ночного запуска без laptop — cloud routine.

## 22. Review, CI и API automation

Источник: [Code Review](https://code.claude.com/docs/en/code-review); managed GitHub service **research preview, Team/Enterprise**.

Fleet анализирует PR и публикует severity findings; не approve/merge. Настраивается CLAUDE.md/REVIEW.md, token billing отдельно через usage credits, не included allowance (официальная оценка average $15–25, **не фиксированная цена**). Local `/code-review` доступен и другим планам и проверяет diff; `--fix` меняет код, поэтому выбор явный.

Источник: [Ultrareview](https://code.claude.com/docs/en/ultrareview); **research preview**. `/code-review ultra` запускает multi-agent verification в cloud, требует subscription auth; dialog показывает scope/estimated spend. Pro/Max имеют 3 free runs, далее usage credits. API-key-only/providers/ZDR/HIPAA исключены; когда unavailable, command может выполнить local review. Не гарантировать, что слово ultra всегда означает cloud.

Источник: [GitHub Actions](https://code.claude.com/docs/en/github-actions). GitHub Action запускает tasks/review на собственном runner, требуется account credentials или поддержанный provider + repo permissions. Это отдельная от managed Review схема и costs. Для программных flows `claude -p`/Agent SDK с explicit permissions/budget; не публиковать magic auth secrets в YAML.

## 23. Data boundary

Источник: [Data usage](https://code.claude.com/docs/en/data-usage).

Local execution не означает offline inference: prompts/code context уходят model provider. У consumer Pro/Max использование для model improvement зависит от privacy setting; commercial Team/Enterprise/API не обучают на code/prompts по умолчанию. Session transcripts сохраняются локально plaintext для resume. Cloud checkout и transcripts находятся на server-side infrastructure по plan policies. Remote Control тоже синхронизирует transcript. В публичном обзоре достаточно короткого практического блока: проверить privacy setting, исключить secrets, не подключать production write credentials ради первой UI итерации. Не обещать ZDR всем Enterprise seats.

Источник: [Self-hosted environments](https://code.claude.com/docs/en/self-hosted-environments); **public beta Team/Enterprise, off by default**. Execution можно разместить на своей инфраструктуре, но requests к model API и session coordination не становятся offline/local-only. Отдельный advanced блок, не обязательная установка начинающему.

## 24. Проверенные команды для компактной шпаргалки

Ниже только документированные команды; availability зависит от поверхности и account. [Commands](https://code.claude.com/docs/en/commands) подтверждает названия, detail pages выше — semantics.

| Намерение | Команда | Оговорка |
| --- | --- | --- |
| Начать | `claude` | В папке project |
| Проверить среду | `claude --version`, `/status`, `/doctor` | CLI/app runtime версии могут различаться |
| Изучить до edits | `/plan` | Или `claude --permission-mode plan` |
| Project instructions | `/init`, `/memory` | Проверить предложенные правила |
| Выбрать model/effort | `/model`, `/effort` | Provider/admin ограничения |
| Контекст | `/context`, `/compact` | Компактизация не бесконечная память |
| Side question | `/btw` | Не добавляет обычный turn в main history |
| Diff/review | `/diff`, `/code-review` | Review не merge |
| Run app | `/run`, `/verify` | Browser/GUI tools требуют настройки |
| Расширения | `/plugin`, `/mcp` | Доверенные sources/credentials |
| Parallel tasks | `/tasks`, `/agents`, `claude agents` | Subagent definitions != Agent view |
| Isolation | `claude --worktree ui-polish` | Первый commit обязателен |
| Restore | `/rewind`, `/resume` | Checkpoint limitations выше |
| Browser | `claude --chrome`, `/chrome` | Subscription + extension |
| Remote | `/remote-control` | Компьютер включён |
| Cloud handoff | `claude --cloud`, `claude --teleport` | Git state/account/repo requirements |
| Schedule | `/schedule` | Local subscription CLI создаёт cloud routine |
| Long task | `/goal` | Чёткое completion condition |

## 25. Редакторские решения и независимые практические примеры

Рекомендация: обзор отдельной reference-страницей, вне 22 глав и XP. В начале — что делает продукт и короткий маршрут «установить → определить scope → plan → build → run/verify → diff/review». Затем раскрываемые карточки по задачам: UI iteration; existing repo; repeating workflow; parallel work; work from phone; subscription/budget. Core differences оплачиваемости держать видимыми.

Независимые авторские scenario prompts (не цитаты документации):

- «Сначала найди компоненты этого экрана и предложи план. После согласования исправь только мобильную шапку; покажи, какие файлы изменились».
- «Воспроизведи clipping диалога на 360px в реальном browser. Исправь причину, затем повтори тот же сценарий и приложи evidence».
- «Подготовь review текущего diff: ищи regressions, доступность keyboard и broken states; не меняй файлы до обсуждения findings».
- «Запиши как project skill нашу процедуру: запуск dev app, проверка login, 360px и desktop, подтверждение exact source copy».
- «Два независимых subagents исследуют причины медленного navigation и UI overflow. Writers не должны одновременно менять одни файлы».

Не сравнивать продукты, не ранжировать, не писать гарантированный “делает всё сам”, не связывать fast/parallel/model effort с количеством гарантированных запросов.
