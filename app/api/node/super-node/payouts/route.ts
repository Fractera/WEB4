// @api list the payouts the super node has received
import { NextRequest, NextResponse } from "next/server"

import { requireRoles } from "@/lib/auth/require-roles"
import { readPayouts } from "@/lib/web4-items/super-node"

// ВЫПЛАТЫ СУПЕР-УЗЛА (530-3): строки журнала узла `data/node/super-node-payouts.jsonl` — доля котла периода, плата за выдачу и доставку,
// доля платы за голосование о метке, награда за доказанное нарушение. Писателя сегодня нет (сеть не подключена) — список пуст. Только
// архитектор: доход владельца узла.
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const denied = await requireRoles(req, ["architect"])
  if (denied) return denied
  return NextResponse.json({ ok: true, payouts: readPayouts() }, { headers: { "Cache-Control": "no-store" } })
}
