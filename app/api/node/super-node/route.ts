// @api read the super node application and settings and change them
import { NextRequest, NextResponse } from "next/server"

import { requireRoles } from "@/lib/auth/require-roles"
import { isTemporaryPublicAddress } from "@/lib/auth/temporary-address"
import { applySuperNode, parseSettings, readSuperNode, saveSettings, withdrawSuperNode } from "@/lib/web4-items/super-node"

// СУПЕР-УЗЕЛ (530-3): GET — заявка (нет · подана · одобрена), предупреждения, настройки, кошелёк узла.
// POST `{ action: "apply" }` — заявка от кошелька узла (без кошелька — 409); `{ action: "withdraw" }` — отозвать;
// `{ action: "settings", country, coverage[], regional[], lists[] }` — проверка и запись (отказ — 400 с родом, файл не тронут).
// В сеть Lagrix ничего не уходит. Только архитектор; на временном адресе запись запрещена.
export const dynamic = "force-dynamic"

const ROLES = ["architect"] as const
const NO_STORE = { "Cache-Control": "no-store" }

export async function GET(req: NextRequest) {
  const denied = await requireRoles(req, ROLES)
  if (denied) return denied
  return NextResponse.json({ ok: true, ...readSuperNode() }, { headers: NO_STORE })
}

export async function POST(req: NextRequest) {
  if (isTemporaryPublicAddress(req)) return NextResponse.json({ ok: false, error: "temporary-address" }, { status: 403, headers: NO_STORE })
  const denied = await requireRoles(req, ROLES)
  if (denied) return denied
  const body = (await req.json().catch(() => null)) as { action?: unknown } | null
  if (body?.action === "apply") {
    const r = applySuperNode()
    if (r === "no-wallet") return NextResponse.json({ ok: false, error: "no-wallet" }, { status: 409, headers: NO_STORE })
  } else if (body?.action === "withdraw") {
    withdrawSuperNode()
  } else if (body?.action === "settings") {
    const parsed = parseSettings(body)
    if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400, headers: NO_STORE })
    saveSettings(parsed.value)
  } else {
    return NextResponse.json({ ok: false, error: "bad-action" }, { status: 400, headers: NO_STORE })
  }
  return NextResponse.json({ ok: true, ...readSuperNode() }, { headers: NO_STORE })
}
