# `/architect/super-node` — Super node

Step 530-3 (owner 2026-10-18: «Под паспортом делаем ещё одно вкладку которую будет называться супер узел …»). A group of the architect layer
right under «Passport» (order 11). Its home explains what a super-node is (Lagrix documents 05 §5.6, 06, 14, 15) and holds the application
(`components/super-node/super-node-application.client.tsx`, door `/api/node/super-node`, file `data/node/super-node.json`): none · submitted,
waiting for approval · approved, waiting for integration. The application comes from the node wallet; the node keeps it until it is connected
to the Lagrix network — nothing is sent. Pages: `notices` (this computer against the Tier-2 profile, warnings), `payouts` (a table with
pages), `settings` (country, coverage, regional restrictions, open lists).

| Path | Role |
|---|---|
| `page.tsx` | group index: the explanation, the application, the list of its pages |
| `_data/` | `slug`, `order` 11, `icon` server, words `en` + `ru` |
| `_components/index.ts` | empty — the working parts are islands |
