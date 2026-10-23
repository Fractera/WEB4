// @api read finished study reports and record the agent verdict
import { timingSafeEqual } from "node:crypto"
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { NextRequest, NextResponse } from "next/server"
import { requireRoles } from "@/lib/auth/require-roles"
import { emitReverse } from "@/lib/study/reverse-events"
import { siteOf } from "@/lib/study/study.mjs"

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

// 556-11 (владелец 2026-10-23: «кнопку проанализировать итог … выдаёшь мне рекомендацию … продолжить разбор или … отправить в продуктовый
// Quiz»): решение главного агента по итогу разбора — `verdict.json` рядом с отчётом. Пишет только агент узла (ключ узла); страница читает.
// 556-13 (владелец 2026-10-23: «если … мне нужно войти в авторизацию … выйди оранжевую карточку»): `signIn` — недостающее видно только
// после входа на этот сайт; страница показывает карточку окна входа тестовой учётной записи, и «Продолжить разбор» ждёт входа.
type Verdict = { verdict: "continue" | "quiz"; summary: string; pages: { address: string; note: string }[]; at: string; signIn?: { site: string } }
const verdictOf = (dir: string): Verdict | null => {
  try { const v = JSON.parse(read(join(dir, "verdict.json")) ?? "null") as Verdict | null; return v && (v.verdict === "continue" || v.verdict === "quiz") ? v : null } catch { return null }
}

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
    // 556-9: the page names what was studied (target, kind, the first lines of the summary) instead of a task id; `jobs` stays for
    // the element's `npm run reverse -- list`. Newest first.
    // 556-14/556-15: a part of a series (`series`, `part` in report.json; the first study is part 1 and names the series) and its
    // screens in the node storage (`screens[].shot.id`) — the page shows them as thumbnails and joins the parts of a series in one row.
    const items = jobs.map((j) => summaryOf(j)).reverse()
    return NextResponse.json({ ok: true, jobs, items }, { headers: HEADERS })
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
  // 556-15: the parts of this series after the first, so `npm run report -- <series> --full` prints the whole series.
  const parts = existsSync(REPORTS)
    ? readdirSync(REPORTS, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== job && existsSync(join(REPORTS, d.name, "report.json")))
        .map((d) => summaryOf(d.name)).filter((s) => s.series === job).sort((a, b) => a.part - b.part).map((s) => ({ job: s.job, part: s.part }))
    : []
  return NextResponse.json({ ok: true, job, report, markdown: read(join(dir, "report.md")), verdict: verdictOf(dir), parts }, { headers: HEADERS })
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** One study for the list: what was studied, its decision, its place in a series and its stored screens (ids only, never a URL). */
function summaryOf(j: string) {
  let r: { target?: { source?: string; name?: string; kind?: string }; summary?: string; series?: unknown; part?: unknown; screens?: unknown } = {}
  try { r = JSON.parse(read(join(REPORTS, j, "report.json")) ?? "{}") } catch { /* a broken report shows its id only */ }
  const series = typeof r.series === "string" && JOB.test(r.series) ? r.series : j
  const part = series !== j && Number.isInteger(r.part) && Number(r.part) > 1 ? Number(r.part) : 1
  const screens = (Array.isArray(r.screens) ? r.screens : [])
    .map((s: { name?: unknown; id?: unknown; shot?: { id?: unknown } }) => ({ name: String(s?.name ?? s?.id ?? "").slice(0, 120), id: String(s?.shot?.id ?? "") }))
    .filter((s) => UUID.test(s.id))
    .slice(0, 60)
  return { job: j, target: r.target?.source || r.target?.name || "", kind: r.target?.kind || "other", summary: String(r.summary ?? "").slice(0, 400), verdict: verdictOf(join(REPORTS, j)), series, part, screens }
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")

export async function POST(req: NextRequest) {
  if (!nodeKeyOk(req.headers.get("x-node-key"))) return NextResponse.json({ ok: false, error: "node key required" }, { status: 401, headers: HEADERS })
  const b = (await req.json().catch(() => null)) as { job?: unknown; verdict?: unknown; summary?: unknown; pages?: unknown; signIn?: unknown } | null
  const job = text(b?.job, 90)
  if (!JOB.test(job)) return NextResponse.json({ ok: false, error: "bad-job" }, { status: 400, headers: HEADERS })
  const dir = join(REPORTS, job)
  if (!existsSync(join(dir, "report.json"))) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404, headers: HEADERS })
  if (b?.verdict !== "continue" && b?.verdict !== "quiz") return NextResponse.json({ ok: false, error: "verdict must be continue or quiz" }, { status: 400, headers: HEADERS })
  const summary = text(b.summary, 2000)
  if (!summary) return NextResponse.json({ ok: false, error: "summary required" }, { status: 400, headers: HEADERS })
  const pages = (Array.isArray(b.pages) ? b.pages : []).slice(0, 12).map((p) => ({ address: text((p as { address?: unknown })?.address, 300), note: text((p as { note?: unknown })?.note, 500) })).filter((p) => p.address || p.note)
  const verdict: Verdict = { verdict: b.verdict, summary, pages, at: new Date().toISOString() }
  const signInRaw = text(b.signIn, 300)
  if (signInRaw) {
    if (b.verdict !== "continue") return NextResponse.json({ ok: false, error: "signIn goes with continue only" }, { status: 400, headers: HEADERS })
    const t = siteOf(signInRaw)
    if (t.error || !t.site) return NextResponse.json({ ok: false, error: `signIn: ${t.error ?? "not a site"}` }, { status: 400, headers: HEADERS })
    verdict.signIn = { site: String(t.site) }
  }
  writeFileSync(join(dir, "verdict.json"), JSON.stringify(verdict, null, 2) + "\n", "utf8")
  // 556-13: открытая страница (ящик с терминалом, который открыл человек) получает сигнал и показывает кнопку без «Обновить».
  emitReverse({ kind: "verdict", job, verdict: verdict.verdict, at: verdict.at })
  return NextResponse.json({ ok: true, job, verdict }, { headers: HEADERS })
}
