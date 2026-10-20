---
name: route-to-element
description: Both natures — the first line follows the request (a building request handed to an element is the build process, a job of a working element is the working process). Give a request to the element of this node that does it — find it by its role, answer with its agent's Telegram bot or terminal, never do its work yourself. Load it whenever the person asks for something an element of the node does (sign-in, data, settings, design, a site, a custom element's job), asks who does what, or names an element.
---

# Route a request to its element

**Process: both** — you change nothing yourself and answer in two or three lines; the first line names the process of the request you pass on.

A hint, not a law: models of late 2026 work worse under rigid step-by-step instructions.

## Why

Every element has its own agent with its own instruction, skills and code. That agent knows its element; you know the node.
Doing an element's job from here means loading what its agent already has — the person pays twice and the element's code
changes without its agent knowing.

## How

1. `npm run find -- <the job in plain English words>` — the registry's candidates, at most five, each with its role and how to reach
   its agent (`npm run contacts -- <id>` — one element again). Never list the whole node: it grows.
2. Pick the element whose role covers the job. Two fit — ask the person one question about how they differ, then record one role
   for each (`npm run role`).
3. Answer with the element and how to reach its agent, as `find` prints it:
   > «Это делает элемент **auth** — вход и роли для всех элементов. Его агент: Telegram t.me/<bot>, терминал <link>. Там его
   > среда разработки — напишите ему.»
4. The element has no bot — give its terminal and say a bot can be connected on its page «Messenger → H2A → Telegram».

## Not here

- Nobody in the node fits → skill `create-element` (the network first, then a new element).
- The person wants you to do it anyway — say once why the element's agent should do it, then pass the task with
  `npm run task -- <id> "<the person's words>"` and tell the person it went there.
