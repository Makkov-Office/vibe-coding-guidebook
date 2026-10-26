---
name: spec-conflict
description: Оформление SPEC CONFLICT, когда источники требований противоречат друг другу или реализации, и остановка спорной интеграции до решения человека. Загружать при любом расхождении spec, тикета и repo contract.
---

# spec-conflict

`[Hnn.m]` — глава и раздел handbook, как в `AGENTS.md`.

Spec conflict — изменение approved requirement, которое нельзя решить внутри scope тикета (`schemas/ticket.schema.json`) [H10.4].

## Когда
- Product requirement и repo contract / предлагаемая реализация расходятся [H10.4].
- Тикет требует того, что противоречит source_docs или принятому ADR [H06.2] [H10.2].
- Неясно, какой источник актуален: источники должны быть актуальны, blocking conflicts отсутствуют до Todo [H06.2].

## Шаги
1. MUST: зафиксировать оба источника с точной ссылкой [H10.4].
2. MUST: описать, что меняет approved requirement, и impact на поведение, permissions или delivery [H10.4].
3. MUST: предложить варианты: минимальная совместимая реализация / явное решение человека [H10.4].
4. MUST: не интегрировать спорный contract до решения [H10.4].
5. MAY: продолжать только работу, не зависящую от решения [H10.4].
6. MUST: если нужен gate — запросить решение по `schemas/decision-packet.schema.json`, назвав конкретное действие и источник требования [H15.1].

## Формат
```text
SPEC CONFLICT
Source A: product requirement и точная ссылка
Source B: реализация / repo contract и точная ссылка
Conflict: что меняет approved requirement
Impact: затронутое поведение, permissions или delivery
Options: минимальная совместимая реализация / явное решение человека
Blocked action: не интегрировать спорный contract
Independent work: только работа, не зависящая от решения
```

## Правила
- MUST NOT: переписывать spec задним числом, чтобы оправдать код [H10.1].
- MUST NOT: решать конфликт молча в коде или расширять scope PR [H07.1].
- MUST: новый самостоятельный scope — follow-up тикет [H07.1].
- MUST: spec conflict блокирует ready verdict review [H14.4].
- MAY: textual conflict в index ADR решать сохранением обеих записей, если они независимы; принятый ADR не удалять [H13.1] [H10.2].

## Выход
Блок SPEC CONFLICT в PR или тикете; при необходимости — decision packet по `schemas/decision-packet.schema.json`.
