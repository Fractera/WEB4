// @api read which Stripe keys are set and save checked new ones
import { NextRequest, NextResponse } from "next/server"

import { requireRoles } from "@/lib/auth/require-roles"
import { isTemporaryPublicAddress } from "@/lib/auth/temporary-address"
import { isBornElement } from "@/lib/web4-items/element-delete"
import { idOfAddress } from "@/lib/web4-items/element-address"
import { parseStripe, probeStripe, saveStripe, stripeState } from "@/lib/stripe-keys"

// КЛЮЧИ STRIPE (530-1): `?target=core` или адрес/id рождённого элемента.
//   GET  — какие ключи заданы и режим (test/live). Значений в ответе нет никогда.
//   POST `{ target, secretKey?, publishableKey?, webhookSecret? }` — формат каждого, один режим у пары, секретный ключ — настоящим вызовом
//        Stripe; отказ — 400/422/502 с родом, `.env.local` не тронут.
// Ворота architect/admin; на временном публичном адресе — отказ: ключ, вписанный через чужой туннель, — утечка.
export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "no-store" }

function targetOf(raw: string): string | null {
  if (raw === "core") return "core"
  const id = idOfAddress(raw)
  return id && isBornElement(id) ? id : null
}

async function gate(req: NextRequest): Promise<NextResponse | null> {
  if (isTemporaryPublicAddress(req)) return NextResponse.json({ ok: false, error: "temporary-address" }, { status: 403 })
  return requireRoles(req, ["architect", "admin"])
}

export async function GET(req: NextRequest) {
  const denied = await gate(req)
  if (denied) return denied
  const target = targetOf(req.nextUrl.searchParams.get("target") ?? "")
  if (!target) return NextResponse.json({ ok: false, error: "unknown-target" }, { status: 404, headers: NO_STORE })
  return NextResponse.json({ ok: true, ...stripeState(target) }, { headers: NO_STORE })
}

export async function POST(req: NextRequest) {
  const denied = await gate(req)
  if (denied) return denied
  const body = (await req.json().catch(() => null)) as { target?: unknown } | null
  const target = targetOf(typeof body?.target === "string" ? body.target : "")
  if (!target) return NextResponse.json({ ok: false, error: "unknown-target" }, { status: 404, headers: NO_STORE })
  const parsed = parseStripe(body)
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400, headers: NO_STORE })
  if (parsed.value.secretKey) {
    const probe = await probeStripe(parsed.value.secretKey)
    if (probe === "key-rejected") return NextResponse.json({ ok: false, error: "key-rejected" }, { status: 422, headers: NO_STORE })
    if (probe === "probe-failed") return NextResponse.json({ ok: false, error: "probe-failed" }, { status: 502, headers: NO_STORE })
  }
  if (!saveStripe(target, parsed.value)) return NextResponse.json({ ok: false, error: "not-saved" }, { status: 500, headers: NO_STORE })
  return NextResponse.json({ ok: true, ...stripeState(target) }, { headers: NO_STORE })
}
