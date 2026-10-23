---
name: analyze-study
description: "Work skill. «Подвергни критическому анализу итог разбора <task> …» or «Проанализируй итог разбора …» — the architect pressed «Analyse the result» under a finished study on an element's «Reverse engineering» page. Audit the study against a 100% bar: can the closest or an identical product be built from it — every page at full depth, every function, every business task? List every gap, decide continue or quiz, record it with npm run verdict, answer in two lines."
---

# Critical audit of a finished study

**Process: working** — the decision is data next to the report (`verdict.json`); nothing changes in git.

A hint, not a law: models of late 2026 work worse under rigid step-by-step instructions.

**The question**, the owner's words of 2026-10-23: «подверг критическому анализу полученный в результате реверс-инжиниринга результат и
подтверди можно ли с уверенностью 100% создать максимально близкий или абсолютно аналогичный продукт включающий все страницы на всю
глубину все функции и все бизнес задачи». You are the auditor, not the author: look for what is missing, not for what is good.
✗ 2026-10-23 the first version asked «хватает ли его», and the agent asked back and answered with «if … then …» branches. The owner: «it is
100% traush», «такое ощущение что ты его спросил скажи что я молодец».

**The goal** is a product like the studied one (the page lives in «Product design»); the element's quiz vision, if it has one, narrows it.
Do not ask what to build.

1. `npm run report -- <task> --full` — the whole report and its limits.
2. Audit three layers. Mark every item **seen** (observed on a page or in a captured response), **inferred** (from documents, script
   strings, guesses) or **not seen**:
   - **Pages at full depth** — every page and state of the product: public pages, everything behind the sign-in (the user's and the
     maker's cabinets, settings), every form with its fields and validation messages, empty, error and loading states, emails and
     notifications, the operator's or admin side.
   - **Functions** — every action of every role, with its rule: limits, prices, order of steps, who may do it.
   - **Business tasks** — how the product earns and runs: payments and their states, refunds, moderation, ranking, anti-abuse, support,
     the operator's tools.
3. The bar is 100%. If anything the product needs is inferred or not seen, the decision is **continue**. **quiz** only when every page,
   function and business task is seen, or when the person accepts the listed gaps in so many words.
4. `npm run verdict -- <task> continue|quiz "<seen X, inferred Y, not seen Z; the three biggest gaps>" --page "<address> | <what to capture: fields, states, buttons, messages>"`
   — one `--page` per page a screenshot or a sign-in can close; several gaps on one page go into one `--page`. Gaps no page can close
   (the admin side, the payment provider) go into the summary.
5. Answer in two lines: «Нет, со 100% уверенностью не построить: видено X из N, не видели главного — …» (or «Да …»), and what the
   highlighted button under the study does. No praise of the study and no «if … then …».

Stay in the session for the person's reply: the answer is read in the terminal on the page, and closing yourself closes their terminal.
Never start a new study from this skill and never edit the report — a new study starts from the page or from the person's words.
