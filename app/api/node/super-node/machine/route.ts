// @api measure this computer against the super node hardware profile
import { NextRequest, NextResponse } from "next/server"

import { requireRoles } from "@/lib/auth/require-roles"
import { machineFacts, TIER2 } from "@/lib/web4-items/machine-facts"

// ПАРАМЕТРЫ МАШИНЫ (530-3): ядра, AES-NI, память, диск узла — и профиль Tier-2 документа Lagrix 14, с которым их сравнивает страница
// «Супер узел → Уведомления Lagrix». Число о машине — спрашивается при открытии страницы. Только архитектор.
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const denied = await requireRoles(req, ["architect"])
  if (denied) return denied
  return NextResponse.json({ ok: true, facts: await machineFacts(), tier2: TIER2 }, { headers: { "Cache-Control": "no-store" } })
}
