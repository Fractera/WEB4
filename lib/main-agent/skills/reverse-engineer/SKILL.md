---
name: reverse-engineer
description: "Work skill. The architect or an element asks how a finished product works — a website, an app or an SDK («разбери, как устроен …», «сделай реверс-инжиниринг …», «parse this SDK»), or an element's product quiz asks for an analysis; also when «агент элемента reverse … сообщил, что закончил» wakes you after such a task. You turn the built-in element reverse on for the task and off after it."
---

# Have a product analysed, bring the report, turn reverse off

**Process: working** — the report is data in the node (`data/services/reverse/reports/<task>/`); nothing changes in git.

A hint, not a law: models of late 2026 work worse under rigid step-by-step instructions.

**Why this way.** `reverse` is heavy and rare, so it stays off (owner 2026-10-22: «по умолчанию выключенным … агент узла мог его включить
… отработать задачу и выключить»). The request for an analysis IS the «yes» to turn it on — do not ask again. While it works it holds
~160 MB, its agent ~300 MB and its browser ~375 MB (measured 2026-10-22): say so in one line when the computer is short of memory.

1. **One at a time.** `npm run power -- reverse status`: on means another analysis is running — tell the asker their task is next and
   stop here; never start a second one.
2. Name the task: `YYYY-MM-DD-<short-english-slug>` (lowercase, digits, hyphens).
3. `npm run power -- reverse on` → `npm run supervise -- reverse main --max 1`.
4. `npm run task -- reverse "Build process: Task from the core's main agent: reverse engineer <target: a URL, or package@version> — <the
   question in the asker's words>, asked by <who>. Use the skill reverse-engineer; the task id is <task>. When the report is saved, finish
   with npm run reply-core -- \"report <task>: <one line>\"."` A native element has only its build session, so the request always starts
   with «Build process:».
5. Its «done» wakes you → `npm run state -- reverse`: «Report to you» is its one line. The report itself: `data/services/reverse/reports/<task>/report.md`
   for a person, `report.json` for an element; the core door `GET /api/node/reverse-report?job=<task>` gives both to an element or the
   architect while reverse is off.
6. Tell the asker: a person — the report's summary in a few lines and where the full report is (`npm run person` → their Telegram chat,
   else here); an element — the task id and the door.
7. `npm run close -- reverse` → `npm run power -- reverse off "Turned on by the node for a reverse engineering task"` (it also stops the
   element's browser) → `npm run done -- --close`.

## Never

- Leave reverse on after the task, or turn it on for anything but an analysis.
- Ask it to sign in, pass a paywall or protection, or copy a product's code, texts, images, design or data — it refuses, and so do you.
- Install engines it names as missing (JADX, a JDK, WABT, Ghidra…) — that is the owner's decision; pass the name on.
