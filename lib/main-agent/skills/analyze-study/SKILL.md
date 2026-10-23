---
name: analyze-study
description: "Work skill. «Проанализируй итог разбора <task> …» — the architect pressed «Analyse the result» under a finished study on an element's «Reverse engineering» page, or asks whether a study is enough to build the element's product. Decide: continue the study (name the missing screens) or send it to the element's product quiz; record the decision with npm run verdict; answer in three lines."
---

# Is a finished study enough to build the element's product?

**Process: working** — the decision is data next to the report (`verdict.json`); nothing changes in git.

A hint, not a law: models of late 2026 work worse under rigid step-by-step instructions.

**Why.** A study does not say by itself whether it is enough. The owner, 2026-10-23: «кнопку проанализировать итог … выдаёшь мне
рекомендацию … и дальше ты рисуешь кнопку например продолжить разбор или кнопка отправить в продуктовый Quiz». Your decision appears under
the study with two buttons; the recommended one is highlighted, and the person chooses. ✗ The first study (tinylaunch, 2026-10-23) saw only
public pages, and nobody said that the product itself sits behind the sign-in: the owner called it «облизывать банку с мёдом».

1. `npm run report -- <task> --item <element id>` — target, summary, roles, scenarios, entities, pages, the **limits** (what the study did
   not see) and the element's goal from its product quiz.
2. No quiz yet — the goal is **a product like the studied one**: the page lives in «Product design», a person studies a reference to
   build their own like it. Decide on that goal and do not ask. Ask only when the task names a different goal and it is unclear.
   ✗ 2026-10-23 the agent asked «что строим» and answered with two «if … then …» branches and no decision — the owner: «it is 100% traush».
3. Decide by the goal, not by the size of the report:
   - **continue** — the scenarios that carry the goal were inferred or not seen at all (usually the screens behind a sign-in: a
     dashboard, a submission form, settings, payment). Each missing screen is a page: its address if the report knows it, and what to
     capture there — fields, states, buttons, messages.
   - **quiz** — what the element must build is seen, or the rest is cheap to settle in the quiz conversation.
4. `npm run verdict -- <task> continue|quiz "<2–3 sentences in the person's language: what is enough, what is missing, why>" --page "<address> | <what to capture>"`
   — one `--page` per missing screen; none for quiz. The button «Continue the study» fills the page cards with these pages.
5. Answer in two lines: the decision with its main reason, and what the highlighted button under the study does. One decision — never
   «if it is X, then …; if it is Y, then …»: the second button under the study is there for the person to choose otherwise.

Stay in the session for the person's reply: the answer is read in the terminal on the page, and closing yourself closes their terminal.
Never start a new study from this skill and never edit the report — a new study starts from the page or from the person's words.
