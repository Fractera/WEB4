# `/architect/reverse` — the Reverse engineering element's section

Step 563 (owner, 2026-10-21 and 2026-10-22): the built-in element **reverse** (`WEB4-ITEMS/core/reverse`, repository
`fractera-reverse-engineering-starter`). It studies how a finished site or app works and writes a report in the product's own words for
the product quiz. It is heavy and rare, so its passport turns it off by default («Turned on by the node for a reverse engineering task»):
the node's agent turns it on for one task and off right after (owner 2026-10-22: «по умолчанию выключенным … включить … отработать
задачу и выключить»). Today it is a body only (563-1); the browser, the analysis and the report come in 563-2 and later.

## What is here

| Path | Role |
|---|---|
| `page.tsx`, `_data/` | the menu item «Reverse engineering»: title, lead, `order` 27, icon `flask` |
| `_components/index.ts` | one block `servicePort` with `serviceId: 'reverse'` |
| `preview/` | live preview of the element's home page |
| `claude-code/`, `terminal/`, `telegram/`, `agent-api/`, `_agent-kit/`, `agent-kit.json` | the agent kit — `npm run agent-kit:add -- reverse`; never edited by hand |
