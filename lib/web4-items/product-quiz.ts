import "server-only"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { elementDir } from "@/lib/web4-items/element-github"

// PRODUCT QUIZ OF ONE ELEMENT (node step 536). The person, 2026-10-18: «я считаю что проект должен быть описан на продуктовом
// языке» — what the element is, in product words, before code. The element's agent writes it with the person
// (`development-docs/product/`: `quiz.json` + `modules/<slug>.json`); the core only reads it for «Building → Product design →
// Product quiz».
// 🔒 READ ONLY. An item becomes «confirmed» only by the person's words to the agent; no door of the core writes the quiz.
// 🔒 A BROKEN FILE IS NAMED, NOT HIDDEN: a module listed but missing, a duplicate number or a dependency on an unknown item
// goes into `problems`, and the page prints it — an empty list must never look like «nothing to show».

export type QuizStatus = "draft" | "confirmed"
/** 536-2: a step of the element that names the item in its «Serves:» line. */
export type QuizStepState = "planned" | "in-progress" | "done"
export type QuizStep = { number: string; title: string; state: QuizStepState; commit?: string }
/** The work on an item, summed over its steps: in progress → orange; else planned → blue; else done (or built before) → green. */
export type QuizWork = QuizStepState | "none"
export type QuizItem = {
  id: string
  kind: "scenario" | "rule" | "entity"
  title: string
  text: string
  actor?: string
  acceptance?: string
  dependsOn: string[]
  status: QuizStatus
  confirmed?: { date: string; said: string }
  /** Work done before the quiz existed, outside the element's own steps (for example «node steps 346-351»). */
  builtBefore?: string
  /** 536-2: derived on reading, never written in the quiz — the steps are the one source. */
  steps: QuizStep[]
  work: QuizWork
}
export type QuizModule = { slug: string; title: string; text: string; items: QuizItem[] }
export type ProductQuiz = {
  language: string
  vision: { text: string; status: QuizStatus }
  actors: { id: string; name: string; text: string }[]
  modules: QuizModule[]
  openQuestions: { id: string; text: string; about: string[] }[]
  notNow: { id: string; text: string }[]
  slices: { id: string; name: string; items: string[] }[]
  decisions: { date: string; said: string; gist: string }[]
}
export type QuizRead = { quiz: ProductQuiz | null; problems: string[] }

const FOLDER = join("development-docs", "product")
const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/

const str = (v: unknown): string => (typeof v === "string" ? v : "")
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [])
const list = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : []
const status = (v: unknown): QuizStatus => (v === "confirmed" ? "confirmed" : "draft")

function readJson(path: string): { value: Record<string, unknown> | null; error: string | null } {
  try {
    const value = JSON.parse(readFileSync(path, "utf8"))
    return value && typeof value === "object" ? { value, error: null } : { value: null, error: "not an object" }
  } catch (e) {
    return { value: null, error: e instanceof Error ? e.message : String(e) }
  }
}

function item(raw: Record<string, unknown>): QuizItem {
  const kind = raw.kind === "rule" || raw.kind === "entity" ? raw.kind : "scenario"
  const confirmed = raw.confirmed && typeof raw.confirmed === "object" ? (raw.confirmed as Record<string, unknown>) : null
  return {
    id: str(raw.id),
    kind,
    title: str(raw.title),
    text: str(raw.text),
    actor: str(raw.actor) || undefined,
    acceptance: str(raw.acceptance) || undefined,
    dependsOn: strs(raw.dependsOn),
    status: status(raw.status),
    confirmed: confirmed ? { date: str(confirmed.date), said: str(confirmed.said) } : undefined,
    builtBefore: str(raw.builtBefore) || undefined,
    steps: [],
    work: "none",
  }
}

// 536-2 (the person, 2026-10-18): «для каждого пункта при наведении показывать какой шаг разработки и под шаг разработки связан с этим
// пунктом и статус запланирован в работе завершен». 🔒 ONE SOURCE: a step names the items it serves in one line `Serves: S-03, R-02`
// (its plan in `steps-new/`, its summary in `steps-done/`, a small step in `current-step.md`); the quiz keeps no second list. The state
// comes from where the file lies: `steps-new/` — planned, the step named active in `current-step.md` — in progress, `steps-done/` — done.
const SERVES = /^[\s>*_-]*serves[*_]*\s*:[*_]*\s*(.+)$/im
const ITEM_ID = /^[A-Z]-\d+$/
const ACTIVE = /\*\*Active step:\*\*\s*(\d+)/i
const COMMIT = /\bcommits?\b[^\n]*?\b([0-9a-f]{7,40})\b/i

function servesOf(text: string): string[] {
  const m = SERVES.exec(text)
  return m ? m[1].split(/[\s,;]+/).map((s) => s.replace(/[`*]/g, "")).filter((s) => ITEM_ID.test(s)) : []
}

function titleOf(text: string, file: string): string {
  const h = /^#\s+(.+)$/m.exec(text)
  return (h ? h[1] : file.replace(/\.md$/, "")).trim()
}

function readText(path: string): string {
  try {
    return readFileSync(path, "utf8")
  } catch {
    return ""
  }
}

function mdFiles(dir: string): string[] {
  try {
    return readdirSync(dir).filter((n) => n.endsWith(".md") && n !== "README.md" && statSync(join(dir, n)).isFile())
  } catch {
    return []
  }
}

/** Every step of the element that serves at least one item: `{ step, serves }`. */
function elementSteps(dir: string): { step: QuizStep; serves: string[] }[] {
  const docs = join(dir, "development-docs")
  const current = readText(join(docs, "current-step.md"))
  const active = ACTIVE.exec(current)?.[1] ?? null
  const out: { step: QuizStep; serves: string[] }[] = []
  for (const file of mdFiles(join(docs, "steps-new"))) {
    const number = /^(\d+)/.exec(file)?.[1]
    if (!number) continue
    const text = readText(join(docs, "steps-new", file))
    const serves = servesOf(text)
    if (serves.length) out.push({ step: { number, title: titleOf(text, file), state: number === active ? "in-progress" : "planned" }, serves })
  }
  for (const file of mdFiles(join(docs, "steps-done"))) {
    const number = /^(\d+(?:-\d+)?)/.exec(file)?.[1]
    if (!number) continue
    const text = readText(join(docs, "steps-done", file))
    const serves = servesOf(text)
    if (serves.length) out.push({ step: { number, title: titleOf(text, file), state: "done", commit: COMMIT.exec(text)?.[1] }, serves })
  }
  // A small step has no plan file: its «Serves:» line lives in `current-step.md` while it is active.
  const smallServes = servesOf(current)
  if (active && smallServes.length && !out.some((o) => o.step.number === active && o.step.state === "in-progress")) {
    out.push({ step: { number: active, title: titleOf(current, "current-step.md"), state: "in-progress" }, serves: smallServes })
  }
  return out
}

function workOf(it: QuizItem): QuizWork {
  if (it.steps.some((s) => s.state === "in-progress")) return "in-progress"
  if (it.steps.some((s) => s.state === "planned")) return "planned"
  if (it.steps.length || it.builtBefore) return "done"
  return "none"
}

/** The element's quiz, or `quiz: null` when it has none yet (no `quiz.json`). Never throws. */
export function readProductQuiz(id: string): QuizRead {
  const dir = elementDir(id)
  const problems: string[] = []
  if (!dir) return { quiz: null, problems }
  const base = join(dir, FOLDER)
  const head = join(base, "quiz.json")
  if (!existsSync(head)) return { quiz: null, problems }
  const top = readJson(head)
  if (!top.value) return { quiz: null, problems: [`quiz.json: ${top.error}`] }
  const q = top.value

  const modules: QuizModule[] = []
  for (const slug of strs(q.modules)) {
    if (!SLUG.test(slug)) {
      problems.push(`module «${slug}»: not a valid file name`)
      continue
    }
    const file = join(base, "modules", `${slug}.json`)
    if (!existsSync(file)) {
      problems.push(`module «${slug}»: modules/${slug}.json is missing`)
      continue
    }
    const m = readJson(file)
    if (!m.value) {
      problems.push(`modules/${slug}.json: ${m.error}`)
      continue
    }
    modules.push({ slug, title: str(m.value.title) || slug, text: str(m.value.text), items: list(m.value.items).map(item) })
  }

  const vision = q.vision && typeof q.vision === "object" ? (q.vision as Record<string, unknown>) : {}
  const quiz: ProductQuiz = {
    language: str(q.language) || "en",
    vision: { text: str(vision.text), status: status(vision.status) },
    actors: list(q.actors).map((a) => ({ id: str(a.id), name: str(a.name), text: str(a.text) })),
    modules,
    openQuestions: list(q.openQuestions).map((o) => ({ id: str(o.id), text: str(o.text), about: strs(o.about) })),
    notNow: list(q.notNow).map((n) => ({ id: str(n.id), text: str(n.text) })),
    slices: list(q.slices).map((s) => ({ id: str(s.id), name: str(s.name), items: strs(s.items) })),
    decisions: list(q.decisions).map((d) => ({ date: str(d.date), said: str(d.said), gist: str(d.gist) })),
  }

  const seen = new Set<string>()
  const items = modules.flatMap((m) => m.items)
  for (const it of items) {
    if (!it.id) problems.push(`an item without a number: «${it.title}»`)
    else if (seen.has(it.id)) problems.push(`${it.id}: the number is used twice`)
    seen.add(it.id)
  }
  for (const it of items) for (const d of it.dependsOn) if (!seen.has(d)) problems.push(`${it.id}: depends on ${d}, which is not in the quiz`)

  const byId = new Map(items.map((it) => [it.id, it]))
  for (const { step, serves } of elementSteps(dir)) {
    for (const ref of serves) {
      const it = byId.get(ref)
      if (it) it.steps.push(step)
      else problems.push(`step ${step.number} serves ${ref}, which is not in the quiz`)
    }
  }
  for (const it of items) it.work = workOf(it)
  return { quiz, problems }
}
