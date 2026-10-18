import "server-only"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { readWallet } from "@/lib/web4-items/node-wallet"

// СУПЕР-УЗЕЛ — ТО, ЧТО ХРАНИТ УЗЕЛ (530-3). Владелец 2026-10-18: «Под паспортом делаем ещё одно вкладку которую будет называться супер
// узел … главная страница опиши что такое супер узел и предложит подать заявку … уведомление от lagrix … Выплаты … Настройки».
// Правила — документы Lagrix 05 §5.6, 06, 09, 14, 15, 17.9, 18.4, 19, записи 32 и 45.
//
// 🔒 СЕТИ ЕЩЁ НЕТ: узел хранит то, что делает человек (заявка, настройки), а то, что приходит из сети (одобрение, предупреждения о
// мощности, выплаты), читает из своих файлов, у которых сегодня нет писателя, — и честно показывает пустое. Ничего не уходит наружу,
// таймеров и опроса нет.
// 🔒 ФАЙЛЫ ВНЕ GIT (`data/*`): сведения о машине и решения её владельца.

export type SuperNodeStatus = "submitted" | "approved"
export type SuperNodeApplication = { status: SuperNodeStatus; wallet: string; at: string }
export type SuperNodeWarning = { at: string; text: string; deadline?: string }
export type SuperNodeSettings = { country: string; coverage: string[]; regional: string[]; lists: string[] }
type State = { application: SuperNodeApplication | null; warnings: SuperNodeWarning[]; settings: SuperNodeSettings | null }

export type PayoutKind = "pool" | "search" | "delivery" | "official-vote" | "violation-reward"
export type Payout = { at: string; period: string; kind: PayoutKind; amount: number; note: string }

const FILE = join(process.cwd(), "data", "node", "super-node.json")
const PAYOUTS = join(process.cwd(), "data", "node", "super-node-payouts.jsonl")

function read(): State {
  try {
    const s = JSON.parse(readFileSync(FILE, "utf8")) as Partial<State>
    return { application: s.application ?? null, warnings: Array.isArray(s.warnings) ? s.warnings : [], settings: s.settings ?? null }
  } catch {
    return { application: null, warnings: [], settings: null }
  }
}

function write(s: State): void {
  mkdirSync(dirname(FILE), { recursive: true })
  writeFileSync(FILE, `${JSON.stringify(s, null, 2)}\n`)
}

export function readSuperNode(): State & { wallet: string | null } {
  return { ...read(), wallet: readWallet()?.address ?? null }
}

/** Подать заявку: от кошелька узла (док. 05 §5.6 — одна заявка на кошелёк); без кошелька — `no-wallet`. */
export function applySuperNode(): State | "no-wallet" {
  const wallet = readWallet()
  if (!wallet) return "no-wallet"
  const s = read()
  if (!s.application) s.application = { status: "submitted", wallet: wallet.address, at: new Date().toISOString() }
  write(s)
  return s
}

export function withdrawSuperNode(): State {
  const s = read()
  s.application = null
  write(s)
  return s
}

const COUNTRY = /^[A-Z]{2}$/
const TAG = /^[a-z0-9][a-z0-9-]{0,62}$/
const MAX_TAGS = 200
const MAX_LISTS = 20

/** Проверка настроек; отказ называет род: `bad-country`, `bad-tag`, `overlap`, `bad-list`. */
export function parseSettings(body: unknown): { ok: true; value: SuperNodeSettings } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>
  const country = typeof b.country === "string" ? b.country.trim().toUpperCase() : ""
  if (!COUNTRY.test(country)) return { ok: false, error: "bad-country" }
  const tags = (v: unknown): string[] | null => {
    if (!Array.isArray(v)) return null
    const out = [...new Set(v.map((x) => (typeof x === "string" ? x.trim().toLowerCase() : "")).filter(Boolean))]
    return out.length <= MAX_TAGS && out.every((t) => TAG.test(t)) ? out : null
  }
  const coverage = tags(b.coverage)
  const regional = tags(b.regional)
  if (!coverage || !regional) return { ok: false, error: "bad-tag" }
  if (coverage.some((t) => regional.includes(t))) return { ok: false, error: "overlap" }
  if (!Array.isArray(b.lists) || b.lists.length > MAX_LISTS) return { ok: false, error: "bad-list" }
  const lists: string[] = []
  for (const x of b.lists) {
    if (typeof x !== "string" || !x.trim()) continue
    try { if (new URL(x.trim()).protocol !== "https:") return { ok: false, error: "bad-list" } } catch { return { ok: false, error: "bad-list" } }
    lists.push(x.trim())
  }
  return { ok: true, value: { country, coverage, regional, lists } }
}

export function saveSettings(v: SuperNodeSettings): State {
  const s = read()
  s.settings = v
  write(s)
  return s
}

const KINDS: PayoutKind[] = ["pool", "search", "delivery", "official-vote", "violation-reward"]

/** Выплаты из журнала узла (строка JSON на выплату); писателя сегодня нет — сеть не подключена. Испорченная строка пропускается. */
export function readPayouts(): Payout[] {
  let raw = ""
  try { raw = readFileSync(PAYOUTS, "utf8") } catch { return [] }
  const out: Payout[] = []
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue
    try {
      const p = JSON.parse(line) as Partial<Payout>
      if (typeof p.at === "string" && typeof p.amount === "number" && KINDS.includes(p.kind as PayoutKind)) {
        out.push({ at: p.at, period: String(p.period ?? ""), kind: p.kind as PayoutKind, amount: p.amount, note: String(p.note ?? "") })
      }
    } catch { /* испорченная строка — пропуск */ }
  }
  return out.sort((a, b) => (a.at < b.at ? 1 : -1))
}
