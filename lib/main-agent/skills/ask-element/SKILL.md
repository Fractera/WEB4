---
name: ask-element
description: Work skill. The architect wants something checked or found out by an element and the answer from you — «ask template how…», «check the skill X of element Y», «find out from Z». Task the element with npm run task, and when «Element <id> reports on your task: …» wakes you, pass the result to the architect in their language. Also load it whenever such a report wakes you.
---

# Ask an element and bring its answer

**Process: working** — nothing changes in git: the element answers as a job, you pass the answer on.

A hint, not a law: models of late 2026 work worse under rigid step-by-step instructions.

1. Who: the id or address the architect named, or `npm run find -- <English words>`.
2. `npm run task -- <id> "Task from the core's main agent: <what to check or find out, in the architect's words>. It is a check,
   not a build: answer with npm run reply-core -- \"<the result>\"."` Tell the architect in one line that the element is asked and
   that the answer comes from you. If the element has a Telegram bot and is off, the node asks the architect there first.
3. «Element <id> reports on your task: «…»» wakes you → `npm run person`: a Telegram bot — send the result with the channel's
   reply tool to that chat_id; no bot — write it here. A few lines, the architect's language, the element named; nothing added that
   the element did not say.
4. Then `npm run done`. You never build, and you never answer for the element.
