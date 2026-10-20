// @api read and save the payment settings of an element in its passport
import { NextRequest, NextResponse } from "next/server"

import { requireRoles } from "@/lib/auth/require-roles"
import { idOfAddress } from "@/lib/web4-items/element-address"
import { parseCard, readPayments, saveCard } from "@/lib/web4-items/element-payments"

// ПЛАТЕЖИ ЭЛЕМЕНТА (551-4): GET `?item=<адрес|id>` — поле `payments` паспорта и карточка-образец поверх умолчаний; POST `{ item, card: { name,
// consultation, usage, commission } }` — цены карточки возможностей в `payments.web3["a2a-card"].<name>` (описание не трогается). Неверное
// тело — 400 с родом отказа, файл не меняется. Закрыта ролью: цены — решение хозяина элемента.
export const dynamic = "force-dynamic"

const ROLES = ["architect", "admin"] as const
const NO_STORE = { "Cache-Control": "no-store" }

export async function GET(req: NextRequest) {
  const denied = await requireRoles(req, ROLES)
  if (denied) return denied
  const id = idOfAddress(req.nextUrl.searchParams.get("item") ?? "")
  const got = id ? await readPayments(id) : null
  if (!got) return NextResponse.json({ ok: false, error: "no-passport" }, { status: 404, headers: NO_STORE })
  return NextResponse.json({ ok: true, ...got }, { headers: NO_STORE })
}

export async function POST(req: NextRequest) {
  const denied = await requireRoles(req, ROLES)
  if (denied) return denied
  const body = (await req.json().catch(() => null)) as { item?: unknown } | null
  const id = typeof body?.item === "string" ? idOfAddress(body.item) : null
  if (!id) return NextResponse.json({ ok: false, error: "no-passport" }, { status: 404, headers: NO_STORE })
  const parsed = parseCard(body)
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400, headers: NO_STORE })
  const saved = await saveCard(id, parsed.value)
  if (!saved) return NextResponse.json({ ok: false, error: "no-passport" }, { status: 404, headers: NO_STORE })
  return NextResponse.json({ ok: true, card: parsed.value, saved: true }, { headers: NO_STORE })
}
