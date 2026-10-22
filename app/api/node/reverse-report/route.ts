// @api read a finished reverse engineering report of the node by its task id
import { timingSafeEqual } from "node:crypto"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { NextRequest, NextResponse } from "next/server"
import { requireRoles } from "@/lib/auth/require-roles"

// ОТЧЁТ РАЗБОРА (шаг 563-3). Элемент `reverse` выключен почти всегда: узел включает его на одну задачу и сразу выключает (владелец
// 2026-10-22: «по умолчанию выключенным … отработать задачу и выключить»). Поэтому отчёт отдаёт ядро: файлы лежат в данных узла,
// `data/services/reverse/reports/<задача>/` (`report.json` — форма навыка `reverse-engineer` элемента, её читает квиз; `report.md` — для
// человека). Кто вправе: элемент узла с ключом узла (`X-Node-Key`) или архитектор/админ. Список задач — без `job`.
export const dynamic = "force-dynamic"

const HEADERS = { "Cache-Control": "no-store" }
const REPORTS = join(process.cwd(), "data", "services", "reverse", "reports")
const JOB = /^[0-9a-z][0-9a-z-]{2,80}$/

function nodeKeyOk(given: string | null): boolean {
  const expected = process.env.SETTINGS_SECRET ?? ""
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

const read = (file: string) => (existsSync(file) ? readFileSync(file, "utf8") : null)

export async function GET(req: NextRequest) {
  if (!nodeKeyOk(req.headers.get("x-node-key"))) {
    const denied = await requireRoles(req, ["architect", "admin"])
    if (denied) return denied
  }
  const job = req.nextUrl.searchParams.get("job")?.trim() ?? ""
  if (!job) {
    const jobs = existsSync(REPORTS)
      ? readdirSync(REPORTS, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(REPORTS, d.name, "report.json"))).map((d) => d.name).sort()
      : []
    return NextResponse.json({ ok: true, jobs }, { headers: HEADERS })
  }
  if (!JOB.test(job)) return NextResponse.json({ ok: false, error: "bad-job" }, { status: 400, headers: HEADERS })
  const dir = join(REPORTS, job)
  const json = read(join(dir, "report.json"))
  if (json === null) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404, headers: HEADERS })
  let report: unknown
  try {
    report = JSON.parse(json)
  } catch {
    return NextResponse.json({ ok: false, error: "report.json is not JSON" }, { status: 502, headers: HEADERS })
  }
  return NextResponse.json({ ok: true, job, report, markdown: read(join(dir, "report.md")) }, { headers: HEADERS })
}
