import "server-only"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import paths from "@/lib/web4-items/paths.cjs"
import { listServices, serviceUrl } from "@/lib/microservices/registry"
import { fingerprintOf, messengersOf, passportProblems, registryEntryOf } from "@/lib/a2a/passport.mjs"
import { addressOf } from "@/lib/web4-items/address-file.mjs"
import elementProps from "@/lib/web4-items/element-props.cjs"

// РЕЕСТР A2A УЗЛА — ЯДРО КАК ЦЕНТР ОБНАРУЖЕНИЯ (шаг 406-6; владелец 2026-10-05: «центр … это будет ядро»; вызов — напрямую,
// ядро подсказывает адрес). Запись элемента (уровень 1) выводится из его визитки и пишется в реестр при `describe:publish`
// вместе с отпечатком; живая визитка с другим отпечатком = «расходится». Поиск — по словам и тегам, до 10 записей; полная
// визитка — по адресу `/.well-known/agent-card.json` самого элемента.

type Entry = {
  address: string; name: string; description: string
  skills: { id: string; tags: string[] }[]
  hasCatalog: boolean; visibility: string; fingerprint: string; card: string | null
  // 472: H2A · H2H · A2A — какие способы связи есть у элемента; в выдаче всегда из живого паспорта (отпечаток считает только визитку).
  messengers?: { h2a: boolean; h2h: boolean; a2a: boolean }
}
export type NodeEntry = Entry & { id: string; url: string | null; state: "fresh" | "drift" | "unpublished" | "no-card" }

type Props = { id?: string; summary?: string; a2a?: { card?: unknown } }

function elementFolder(id: string, kind: string): string {
  return paths.itemDir(id, kind)
}

/** Визитка элемента с диска или null. */
export function readPassport(id: string, kind: string): Props | null {
  // 417: старый корневой файл или новая раскладка (визитка собирается из паспорта и A2A-CARD.json).
  return elementProps.readElementProps(elementFolder(id, kind)) as Props | null
}

/** Запись уровня 1 из визитки для реестра; null — визитки нет или она не проходит стандарт. */
export function entryForRegistry(id: string, kind: string): Entry | null {
  const p = readPassport(id, kind)
  if (!p?.a2a?.card) return null
  const { problems } = passportProblems(p) as { problems: string[] }
  if (problems.length) return null
  const url = serviceUrl(id)
  return registryEntryOf(p, { address: addressOf(id), cardUrl: url ? `${url}/.well-known/agent-card.json` : null }) as Entry
}

/** Все элементы узла с их записями и состоянием свежести. */
export function nodeEntries(): NodeEntry[] {
  const out: NodeEntry[] = []
  for (const s of listServices() as unknown as { id: string; kind?: string; a2a?: Entry }[]) {
    const kind = s.kind === "user" ? "user" : "core"
    const live = readPassport(s.id, kind)
    const url = serviceUrl(s.id)
    const stored = s.a2a ?? null
    if (!live?.a2a?.card) {
      if (stored) out.push({ ...stored, id: s.id, url, state: "no-card" })
      continue
    }
    const fp = fingerprintOf(live) as string
    const fresh = entryForRegistry(s.id, kind)
    if (!stored) { if (fresh) out.push({ ...fresh, id: s.id, url, state: "unpublished" }); continue }
    out.push({ ...stored, messengers: messengersOf(live) as Entry["messengers"], id: s.id, url, state: stored.fingerprint === fp ? "fresh" : "drift" })
  }
  return out
}

// 548-9: служебные слова не ищутся. ✗ Замерено 2026-10-19: «remove background from product photos» нашло три элемента, которые
// этого не умеют, — «from» совпало с «born from …» их описаний, а подстрока совпадала внутри чужих слов. Агент, получивший
// ложного кандидата, идёт договариваться с ним вместо f2f и квиза.
const STOP = new Set(["the", "and", "for", "from", "with", "that", "this", "into", "your", "you", "our", "its", "are", "can", "will",
  "need", "needs", "want", "make", "get", "all", "any", "some", "who", "what", "how", "please", "element", "elements",
  "для", "что", "как", "это", "мне", "нам", "его", "её", "или", "без", "при", "над", "под", "чтобы", "нужно", "надо", "хочу",
  "который", "которая", "которые", "элемент", "элемента", "элементы"])
const wordsOf = (t: string) => t.toLowerCase().split(/[^\p{L}\p{N}-]+/u).filter((w) => w.length > 2 && !STOP.has(w))
const near = (a: string, b: string) => a === b || (a.length > 3 && b.length > 3 && (a.startsWith(b) || b.startsWith(a)))

/** Найти: до `limit` записей, где совпали значимые слова запроса (теги и id навыков весят больше слов описания). */
export function findEntries(query: string, limit = 10): (NodeEntry & { score: number })[] {
  const words = [...new Set(wordsOf(query))]
  if (!words.length) return []
  return nodeEntries()
    .map((e) => {
      const tags = [...new Set(e.skills.flatMap((s) => [s.id, ...s.id.split("-"), ...s.tags]).map((t) => t.toLowerCase()))]
      const text = wordsOf(`${e.name} ${e.description}`)
      const score = words.reduce((n, w) => n + (tags.includes(w) ? 3 : tags.some((t) => near(t, w)) ? 1 : 0) + (text.some((t) => near(t, w)) ? 1 : 0), 0)
      return { ...e, score }
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 10)))
}
