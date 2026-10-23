// PDF OF THE PRODUCT QUIZ (node step 575). The owner 2026-10-23: «Для продуктов квиз добавь кнопку скачать PDF, должна быть версия дата
// если мы сохраняем её отдельной версии в GitHub то ещё и версия Git которая позволяет откатиться к этой версии позже или просто найти её
// снова»; «and pdf must have screen shots».
// One HTML page for printing, built on the server from the quiz (`readProductQuiz`), the element's git and the screens of its references'
// studies (556-14, `screens[].shot` of every part of a series). Screens are embedded as data URLs, so the printing browser needs no
// network. The door `GET /api/node/product-quiz/pdf` prints this page with Chrome without a window.
import { execFile } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { promisify } from "node:util"

import { dataUrl as nodeDataUrl } from "@/lib/microservices/urls"
import type { ProductQuiz } from "@/lib/web4-items/product-quiz"

const run = promisify(execFile)
const REPORTS = join(process.cwd(), "data", "services", "reverse", "reports")
const JOB = /^[0-9a-z][0-9a-z-]{2,80}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export type QuizGit = {
  commit: string | null
  date: string | null
  dirty: boolean
  remote: string | null
  pushed: boolean
}

async function git(dir: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await run("git", ["-C", dir, ...args], { windowsHide: true, timeout: 15_000 })
    return stdout.trim()
  } catch {
    return ""
  }
}

/** The commit where the quiz changed last, whether it is on GitHub (the remote-tracking branches as git last saw them), uncommitted edits. */
export async function quizGit(dir: string): Promise<QuizGit> {
  const last = await git(dir, ["log", "-1", "--format=%H|%cI", "--", "development-docs/product"])
  const [commit, date] = last ? last.split("|") : [null, null]
  const dirty = (await git(dir, ["status", "--porcelain", "--", "development-docs/product"])) !== ""
  const url = await git(dir, ["remote", "get-url", "origin"])
  const m = url.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?$/)
  const remote = m ? `https://github.com/${m[1]}/${m[2]}` : null
  const pushed = commit ? (await git(dir, ["branch", "-r", "--contains", commit])) !== "" : false
  return { commit: commit || null, date: date || null, dirty, remote, pushed }
}

export type QuizShot = { product: string; job: string; part: number; name: string; data: string }

/** Screens of the references' studies: every part of the series named in `references.products[].report`, embedded as data URLs. */
export async function quizShots(quiz: ProductQuiz, max = 24): Promise<QuizShot[]> {
  const products = quiz.references?.products ?? []
  const base = nodeDataUrl() ?? ""
  const secret = process.env.DATA_SECRET || process.env.DATA_API_KEY || ""
  if (!base || !existsSync(REPORTS)) return []
  const jobs = readdirSync(REPORTS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  const out: QuizShot[] = []
  for (const p of products) {
    const series = String(p.report ?? "").trim()
    if (!JOB.test(series)) continue
    const parts = jobs
      .map((job) => {
        try {
          const r = JSON.parse(readFileSync(join(REPORTS, job, "report.json"), "utf8")) as { series?: unknown; part?: unknown; screens?: unknown }
          const s = typeof r.series === "string" ? r.series : job
          return s === series ? { job, part: Number.isInteger(r.part) ? Number(r.part) : 1, screens: Array.isArray(r.screens) ? r.screens : [] } : null
        } catch { return null }
      })
      .filter((x): x is { job: string; part: number; screens: unknown[] } => x !== null)
      .sort((a, b) => a.part - b.part)
    for (const part of parts) {
      for (const s of part.screens as { name?: unknown; id?: unknown; shot?: { id?: unknown } }[]) {
        if (out.length >= max) return out
        const id = String(s?.shot?.id ?? "")
        if (!UUID.test(id)) continue
        try {
          const res = await fetch(`${base}/media/${id}/file`, { headers: secret ? { "X-Data-Secret": secret } : {} })
          if (!res.ok) continue
          const type = res.headers.get("content-type") ?? "image/png"
          if (!type.startsWith("image/")) continue
          const buf = Buffer.from(await res.arrayBuffer())
          out.push({ product: p.name || p.url || series, job: part.job, part: part.part, name: String(s?.name ?? s?.id ?? ""), data: `data:${type};base64,${buf.toString("base64")}` })
        } catch { /* a missing screen is skipped; the others still print */ }
      }
    }
  }
  return out
}

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export type QuizPdfWords = {
  title: string
  element: string
  exported: string
  changed: string
  commit: string
  onGithub: string
  notPushed: string
  notSaved: string
  dirty: string
  restore: string
  vision: string
  actors: string
  modules: string
  stages: string
  references: string
  openQuestions: string
  notNow: string
  decisions: string
  screens: string
  screensNote: string
  part: string
  draft: string
  confirmed: string
}

const WORDS: Record<"en" | "ru", QuizPdfWords> = {
  en: {
    title: "Product quiz", element: "Element", exported: "Exported", changed: "Quiz last changed", commit: "Git commit of the quiz",
    onGithub: "on GitHub", notPushed: "not on GitHub yet: send the element to GitHub to keep this version", notSaved: "not saved in git",
    dirty: "There are unsaved edits after this commit", restore: "Return to this version", vision: "Vision", actors: "Who uses it",
    modules: "Modules", stages: "Stages", references: "Products like this one", openQuestions: "Open questions", notNow: "Not now",
    decisions: "Decisions", screens: "Screens of the studied products",
    screensNote: "Screens of a studied product, only to understand how it works. Not for copying its design.", part: "part",
    draft: "draft", confirmed: "confirmed",
  },
  ru: {
    title: "Продуктовый квиз", element: "Элемент", exported: "Выгружено", changed: "Квиз последний раз менялся", commit: "Git-коммит квиза",
    onGithub: "есть на GitHub", notPushed: "ещё не на GitHub: отправьте элемент в GitHub, чтобы сохранить эту версию", notSaved: "не сохранено в git",
    dirty: "После этого коммита есть несохранённые правки", restore: "Вернуться к этой версии", vision: "Замысел", actors: "Кто пользуется",
    modules: "Модули", stages: "Этапы", references: "Похожие продукты", openQuestions: "Открытые вопросы", notNow: "Не сейчас",
    decisions: "Решения", screens: "Экраны разобранных продуктов",
    screensNote: "Экран образца, только для понимания устройства — не для копирования оформления.", part: "часть",
    draft: "черновик", confirmed: "подтверждено",
  },
}

export function quizPdfWords(lang: string): QuizPdfWords {
  return lang === "ru" ? WORDS.ru : WORDS.en
}

/** The page for printing: a header with the version, then the quiz, then the screens. Plain HTML and CSS, nothing from the site's shell. */
export function quizPdfHtml(args: { item: string; name: string; lang: string; quiz: ProductQuiz; git: QuizGit; shots: QuizShot[]; at: Date }): string {
  const { item, name, quiz, git: g, shots, at } = args
  const w = quizPdfWords(args.lang)
  const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "—")
  const badge = (s: string) => `<span class="badge ${s === "confirmed" ? "ok" : ""}">${esc(s === "confirmed" ? w.confirmed : w.draft)}</span>`
  const list = (title: string, rows: string[]) => (rows.length ? `<h2>${esc(title)}</h2><ul>${rows.join("")}</ul>` : "")
  const gitBlock = g.commit
    ? `<p><b>${esc(w.commit)}:</b> <code>${esc(g.commit)}</code> · ${g.pushed && g.remote
        ? `${esc(w.onGithub)}: <a href="${esc(`${g.remote}/tree/${g.commit}/development-docs/product`)}">${esc(`${g.remote}/tree/${g.commit.slice(0, 12)}/development-docs/product`)}</a>`
        : `<span class="warn">${esc(w.notPushed)}</span>`}</p>
       <p><b>${esc(w.restore)}:</b> <code>git checkout ${esc(g.commit)} -- development-docs/product</code></p>
       ${g.dirty ? `<p class="warn">${esc(w.dirty)}</p>` : ""}`
    : `<p class="bad"><b>${esc(w.commit)}:</b> ${esc(w.notSaved)}</p>`
  const modules = quiz.modules.map((m) => `<h3>${esc(m.title)}</h3>${m.text ? `<p>${esc(m.text)}</p>` : ""}<ul>${m.items
    .map((i) => `<li><b>${esc(i.id)}</b> ${esc(i.title)} ${badge(i.status)}${i.text ? `<br><span class="muted">${esc(i.text)}</span>` : ""}</li>`).join("")}</ul>`).join("")
  const stages = quiz.stages.map((s) => `<li><b>${esc(w.stages.slice(0, -1) || "Stage")} ${s.n}. ${esc(s.name)}</b> ${badge(s.status)}<br>${esc(s.works)}${s.ready ? `<br><span class="muted">${esc(s.ready)}</span>` : ""}</li>`)
  const refs = (quiz.references?.products ?? []).map((p) => `<li><b>${esc(p.name)}</b> ${esc(p.url)}${p.report ? ` · <code>${esc(p.report)}</code>` : ""}</li>`)
  const shotsBlock = shots.length
    ? `<h2 class="page">${esc(w.screens)}</h2><p class="muted">${esc(w.screensNote)}</p>${shots.map((s) =>
        `<figure><img src="${s.data}" alt="${esc(s.name)}"><figcaption>${esc(s.product)} · ${esc(w.part)} ${s.part} · ${esc(s.name)}</figcaption></figure>`).join("")}`
    : ""
  return `<!doctype html><html lang="${esc(args.lang)}"><head><meta charset="utf-8"><title>${esc(`${name} · ${w.title}`)}</title><style>
  @page { size: A4; margin: 16mm 14mm; }
  body { font: 11pt/1.45 "Segoe UI", system-ui, -apple-system, sans-serif; color: #111; }
  h1 { font-size: 20pt; margin: 0 0 4pt; } h2 { font-size: 14pt; margin: 18pt 0 6pt; } h3 { font-size: 12pt; margin: 12pt 0 4pt; }
  .head { border: 1px solid #ccc; border-radius: 6pt; padding: 8pt 10pt; margin: 8pt 0 12pt; } .head p { margin: 2pt 0; }
  code { font: 9.5pt Consolas, monospace; background: #f3f3f3; padding: 0 2pt; } a { color: #1a4fd6; word-break: break-all; }
  .warn { color: #a15c00; } .bad { color: #b00020; } .muted { color: #555; } ul { padding-left: 16pt; } li { margin: 3pt 0; }
  .badge { font-size: 8.5pt; border: 1px solid #999; border-radius: 8pt; padding: 0 5pt; color: #444; } .badge.ok { border-color: #2e7d32; color: #2e7d32; }
  .page { break-before: page; } figure { margin: 0 0 12pt; break-inside: avoid; } figure img { max-width: 100%; max-height: 230mm; border: 1px solid #ddd; }
  figcaption { font-size: 9pt; color: #555; margin-top: 3pt; }
</style></head><body>
<h1>${esc(w.title)}</h1>
<div class="head">
  <p><b>${esc(w.element)}:</b> ${esc(name)} (<code>${esc(item)}</code>)</p>
  <p><b>${esc(w.exported)}:</b> ${esc(at.toISOString().replace("T", " ").slice(0, 16))} UTC · <b>${esc(w.changed)}:</b> ${esc(day(g.date))}</p>
  ${gitBlock}
</div>
${quiz.vision.text ? `<h2>${esc(w.vision)}</h2><p>${esc(quiz.vision.text)} ${badge(quiz.vision.status)}</p>` : ""}
${list(w.actors, quiz.actors.map((a) => `<li><b>${esc(a.name)}</b>${a.text ? ` — ${esc(a.text)}` : ""}</li>`))}
${quiz.modules.length ? `<h2>${esc(w.modules)}</h2>${modules}` : ""}
${list(w.stages, stages)}
${list(w.references, refs)}
${list(w.openQuestions, quiz.openQuestions.map((q) => `<li>${esc(q.text)}</li>`))}
${list(w.notNow, quiz.notNow.map((n) => `<li>${esc(n.text)}</li>`))}
${list(w.decisions, quiz.decisions.map((d) => `<li><b>${esc(d.date)}</b> ${esc(d.gist || d.said)}</li>`))}
${shotsBlock}
</body></html>`
}
