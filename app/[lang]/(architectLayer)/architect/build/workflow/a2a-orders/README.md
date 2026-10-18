# `/architect/build/workflow/a2a-orders` — A2A: your orders of the main agent

Step 528-3 (owner 2026-10-18): the main agent (the core) gets the same menu scheme as an element — Messenger (H2H, H2A,
Settings) and Working process (Process, A2A: your orders, A2A: your work, Reviews) — as node-wide pages that gather root and
every custom element. The page shows its title and purpose line (`_data`) and, under them, the same page in each element
(`_components/main-agent-elements.tsx` of the layer: custom elements from `listDrafts`, their page from `item-tree.ts` with the
same passport flags as the menu; root runs on the earlier template and says so).

| Path | Role |
|---|---|
| `page.tsx` | thin entry: a section page plus the element links |
| `_data/` | `slug` = folder name, `order`, words `en` + `ru` |
| `_components/index.ts` | the working part — empty until node-wide data is built |

Not built yet: real node-wide data (conversations, orders, deals, reviews gathered from the elements). Until then the page leads to
each element's own page.
