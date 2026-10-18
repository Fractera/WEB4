import "server-only"
import { existsSync, readFileSync } from "node:fs"
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
  }
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
  return { quiz, problems }
}
