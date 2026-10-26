# schemas/

JSON Schema (draft 2020-12) для документов Agent Pack. У каждой схемы есть валидный пример в `examples/<name>.json`.

| Схема | Документ | Источник в handbook |
|---|---|---|
| `ticket.schema.json` | Исполнимый тикет | 6.1, 6.2 |
| `preflight-report.schema.json` | Отчёт preflight | 8.1–8.3, 13.1 |
| `evidence-record.schema.json` | Evidence одной проверки | 11.3 |
| `finding.schema.json` | Finding независимого review | 14.3 |
| `handoff.schema.json` | Передача задачи | 9.3 |
| `decision-packet.schema.json` | Пакет для решения человека | 15.1 |

SHA везде — полный 40-символьный hex. Объекты закрыты (`additionalProperties: false`): поле вне схемы — ошибка. Схемы используют только `type`, `properties`, `required`, `additionalProperties`, `items`, `enum`, `const`, `pattern`, `minLength`, `minItems`, `format`, `anyOf`, поэтому их проверяет любой валидатор 2020-12.
