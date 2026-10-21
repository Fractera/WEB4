// @api the node type: a single project or an app factory
import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

import { requireRoles } from "@/lib/auth/require-roles"
import nodeType from "@/lib/web4-items/node-type.cjs"

// 553: ТИП УЗЛА (`lib/web4-items/node-type.cjs`). Меняет его только человек — этой дверью, командой `npm run node-type` или словом
// главному агенту. Тип задаёт облик НОВЫХ кастомных элементов; существующие перечисляются (`mismatches`) и переключаются по одному.
export const dynamic = "force-dynamic"

const ROLES = ["architect", "admin"] as const

function state() {
  const type = nodeType.readNodeType(process.cwd()) as "project" | "factory"
  return { ok: true, type, mismatches: nodeType.mismatches(type, process.cwd()) }
}

export async function GET(req: NextRequest) {
  const denied = await requireRoles(req, ROLES)
  if (denied) return denied
  return NextResponse.json(state(), { headers: { "Cache-Control": "no-store" } })
}

export async function POST(req: NextRequest) {
  const denied = await requireRoles(req, ROLES)
  if (denied) return denied
  let type: unknown
  try { type = ((await req.json()) as { type?: unknown })?.type } catch { /* нет тела */ }
  if (type !== "project" && type !== "factory") return NextResponse.json({ ok: false, reason: "type must be project or factory" }, { status: 400 })
  nodeType.writeNodeType(type, process.cwd())
  // Окно рождения подставляет облик по типу — страницы элементов перерисовываются (команда из терминала этого не делает).
  revalidatePath("/[lang]", "layout")
  return NextResponse.json(state(), { headers: { "Cache-Control": "no-store" } })
}
