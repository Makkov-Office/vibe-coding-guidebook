# Стартовый промпт для Claude Code

Вставь блок ниже первым сообщением в новую сессию Claude Code (claude.ai/code → репозиторий `Makkov-Office/vibe-coding-guidebook`). Бриф лежит в `docs/PLATFORM_BRIEF.md`, правила — в `AGENTS.md` и `CLAUDE.md`.

---

```text
Продолжаем существующий проект ULTIMATE Vibe-coder guidebook (рабочее имя нового
продукта — Agent Dojo) в репозитории Makkov-Office/vibe-coding-guidebook.
Проект собран в Codex и опубликован на ChatGPT Sites:
https://agentic-engineering-handbook-makkov.makkov.chatgpt.site/
Теперь разработка идёт в Claude Code. Ничего не создавай заново: код и контент
в репозитории — это оригинал 1:1 (PUBLIC-версия 20).

Я — founder (Makkov). Решения о merge, production-деплое, хостинге, имени/домене,
изменении учебного текста и UI, новых зависимостях вне брифа принимаю я.

## Канонические источники (в этом порядке)
1. docs/PLATFORM_BRIEF.md — Product HQ: цели, фазы, тикеты, acceptance.
2. AGENTS.md и CLAUDE.md — как работать в репозитории.
3. docs/cloud-handoff.md и README.md — правила и устройство оригинала.
   Действуют, если бриф их явно не меняет.
4. Код и content/handbook.md на конкретном SHA.
Расхождение источников → остановись и пришли SPEC CONFLICT (глава 10.4).

## Как мы работаем (проект живёт по правилам самого гайда)
- 1 тикет = 1 ветка = 1 сессия автора = 1 PR. В main не пишем.
- Тикеты — GitHub Issues по шаблону .github/ISSUE_TEMPLATE/task.md.
- Перед правками — preflight-отчёт (глава 08.2). FAIL / BLOCKED / INCOMPLETE ≠ PASS.
- Evidence привязано к SHA. Старый PASS не переносится на новый HEAD.
- После реализации — независимое review отдельным субагентом без авторского
  контекста, по reviewer-промпту главы 14.4.
- Остановись перед merge и пришли пакет решения (глава 15.1).
- Учебный текст — только в content/handbook.md, генерация — npm run content.
- Не трогай ChatGPT Sites и .openai/hosting.json.

## Задача на эту сессию — волна 1 фазы 1
1. Прочитай PLATFORM_BRIEF.md (особенно раздел 4), AGENTS.md, cloud-handoff.md.
   Вопросы задавай, только если без ответа нельзя начать; по открытым решениям
   раздела 13 бери дефолты из брифа.
2. Создай GitHub Issues для P1-01 … P1-10 (раздел 4.4) с зависимостями и risk.
   Не получилось — заведи docs/backlog.md в том же формате и скажи об этом.
3. P1-01 (harness): проверь, что guard-hook и deny-правила реально блокируют
   push в main, reset --hard, force push и clean; приложи evidence.
4. P1-02: синхронизируй package-lock.json так, чтобы npm ci проходил с нуля
   (сейчас падает: Missing playwright-core@1.57.0). Затем npm test, typecheck,
   lint, build — evidence с SHA.
5. P1-03 и P1-04: npm run doctor / npm run validate и GitHub Actions CI.
6. Предложи план волны 2 (P1-05 … P1-09: что параллельно, collision class,
   merge order по главе 13) и остановись.

## Как отчитываться
Один отчёт в конце: сделано (issues, ветки, PR, SHA); evidence (команды и
результаты); BLOCKED / INCOMPLETE с причинами; решения, нужные от меня
(конкретные действия); следующий шаг. По-русски, коротко.
```

---

## Короткие команды на потом

| Что нужно | Что написать |
|---|---|
| Следующая волна | `Бери следующую волну по брифу. Preflight, авторы по тикетам, независимое review, остановись до merge.` |
| Один тикет | `Бери P1-06.` |
| Review | `Независимое review PR #NN по главе 14.4. Код не меняй.` |
| После merge | `PR #NN смержен. Post-merge sync по главе 16: main SHA, результат, зависимые PR для refresh.` |
| Публикация артефакта | `Собери static export из main и опубликуй артефактом. Покажи parity-аудит.` |
