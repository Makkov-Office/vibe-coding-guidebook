## 08. Preflight: начать правильно

Preflight проверяет **эту задачу в этой среде сейчас**. Bootstrap готовит среду; DoR проверяет качество задачи; preflight связывает оба слоя с live Git и параллельной работой.

### 8.1. Последовательность

1. Получить актуальный тикет, статус, dependencies и исходные документы.
2. Прочитать AGENTS.md → ARCHITECTURE.md → docs/index.md → профильные contracts.
3. Проверить repo identity, remote, branch, HEAD, worktrees и локальные изменения.
4. Обновить сведения о main через документированного безопасного fetch; записать base SHA.
5. Установить owner; создать или переиспользовать разрешённую task branch/worktree.
6. Проверить DoR, capabilities и bootstrap/doctor.
7. Оценить risk, Docs Impact, active PRs и collision class.
8. Зафиксировать plan, blockers и merge order, если он нужен.
9. Только при PASS перевести тикет в In Progress и начать реализацию.

«Чистый checkout» — требование к своей implementation-папке. Грязный founder checkout не надо очищать ради preflight; используй свою изолированную папку и не трогай чужие файлы.

### 8.2. Отчёт preflight

```text
Ticket: DEMO-42, Todo
Readiness: PASS; dependencies resolved
Repository: verified project remote
Base: origin/main at <actual full SHA>
Ownership: primary author in dedicated worktree
Local state: clean in task worktree
Environment: doctor PASS
Risk: Medium — changes catalogue behavior
Docs Impact: catalogue contract update
Collisions: file overlap only with DEMO-43; shared index reviewed
Merge order: no semantic dependency; recheck before merge
Plan: implement title filtering → test AC → validate → open PR
Result: PASS
```

Это формат отчёта, не выдуманное evidence. Значения в угловых скобках заполняются из реальных checks.

**FAIL** — обнаруженное нарушение. **BLOCKED** — не хватает решения или capability. **INCOMPLETE** — обязательное evidence получить не удалось. Ни одно из них не равно PASS.

### 8.3. Fail closed

Недоступный diff не является пустым diff. Недоступные PR не означают отсутствие PR. Неизвестный branch owner не означает «никто не работает». Если механизм не получил обязательные данные, он останавливает зависимое решение и явно сообщает причину.
