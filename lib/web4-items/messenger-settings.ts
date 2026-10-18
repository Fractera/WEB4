import "server-only"
import { existsSync } from "node:fs"
import { readFile, rename, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { elementDir } from "@/lib/web4-items/element-github"
import elementProps from "@/lib/web4-items/element-props.cjs"

// НАСТРОЙКИ MESSENGER ЭЛЕМЕНТА (528-2). Владелец 2026-10-18: «на вкладке настройки будет: установить дополнительную стоимость
// которую должен заплатить новый пользователь который пытается установить контакт, здесь будет переключать активировать
// дезактивировать и по умолчанию один доллар … правила для агента который ведёт диалог, раздел категорически запрещено, раздел что
// меня интересует»; где хранить — «Сохранять в паспорт элемента».
//
// 🔒 ПОЛЕ `messengerSettings` ПАСПОРТА, А НЕ `messengers`: там флаги H2A · H2H · A2A (да/нет), по которым строится меню (472);
// смешать их с настройками — значит заставить каждого читателя флагов разбирать чужие объекты.
// 🔒 НАРУЖУ НЕ ИДЁТ: публичная дверь элемента (`OWN-SERVICE-PROPS/server.ts`) отдаёт поимённо перечисленные поля, этого среди них нет.
// 🔒 СЕТЬ ЭТО НЕ ПРИМЕНЯЕТ: узел только хранит; тариф не списывается, правила агенту в реальном времени не передаются
// (ничего незаказанного). Применит — подключение к Lagrix (запись 52: тариф первого контакта — один раз, при прочтении).
// 🔒 ПРАВКА ПАСПОРТА — ПРАВКА ФАЙЛА В GIT ЭЛЕМЕНТА: до следующего коммита «Развёртывания» покажут её незакоммиченной.

export type MessengerSettings = {
  firstContact: { enabled: boolean; usd: number }
  agentRules: { forbidden: string[]; interests: string[] }
}

/** Владелец: «по умолчанию один доллар». Без сохранённого значения тариф включён и равен $1. */
export const MESSENGER_DEFAULTS: MessengerSettings = { firstContact: { enabled: true, usd: 1 }, agentRules: { forbidden: [], interests: [] } }

const MAX_USD = 10000
const MAX_RULES = 30
const MAX_RULE = 300

/** Файл паспорта элемента: новая раскладка (`OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json`), иначе прежний файл в корне. */
function passportFile(id: string): string | null {
  const dir = elementDir(id)
  if (!dir) return null
  for (const rel of [elementProps.PASSPORT, elementProps.OLD]) {
    const p = join(dir, rel)
    if (existsSync(p)) return p
  }
  return null
}

const strings = (v: unknown): string[] | null => {
  if (!Array.isArray(v)) return null
  const out = v.map((x) => (typeof x === "string" ? x.trim() : null))
  if (out.some((x) => x === null || x.length > MAX_RULE)) return null
  const kept = (out as string[]).filter(Boolean)
  return kept.length <= MAX_RULES ? kept : null
}

/** Проверка тела двери; отказ называет род — `bad-switch`, `bad-amount`, `bad-rules`. */
export function parseMessengerSettings(body: unknown): { ok: true; value: MessengerSettings } | { ok: false; error: string } {
  const b = (body ?? {}) as { firstContact?: { enabled?: unknown; usd?: unknown }; agentRules?: { forbidden?: unknown; interests?: unknown } }
  const enabled = b.firstContact?.enabled
  if (typeof enabled !== "boolean") return { ok: false, error: "bad-switch" }
  const usd = b.firstContact?.usd
  // Сумма — число, больше нуля, не больше 10 000, не точнее цента. Текст и отрицательное — отказ.
  if (typeof usd !== "number" || !Number.isFinite(usd) || usd <= 0 || usd > MAX_USD || Math.abs(usd * 100 - Math.round(usd * 100)) > 1e-6) {
    return { ok: false, error: "bad-amount" }
  }
  const forbidden = strings(b.agentRules?.forbidden)
  const interests = strings(b.agentRules?.interests)
  if (!forbidden || !interests) return { ok: false, error: "bad-rules" }
  return { ok: true, value: { firstContact: { enabled, usd: Math.round(usd * 100) / 100 }, agentRules: { forbidden, interests } } }
}

/** Сохранённые настройки или умолчание; `saved` — есть ли они в паспорте. Паспорта нет — `null`. */
export async function readMessengerSettings(id: string): Promise<{ settings: MessengerSettings; saved: boolean } | null> {
  const file = passportFile(id)
  if (!file) return null
  try {
    const raw = JSON.parse(await readFile(file, "utf8")) as { messengerSettings?: unknown }
    const parsed = raw.messengerSettings ? parseMessengerSettings(raw.messengerSettings) : null
    return parsed?.ok ? { settings: parsed.value, saved: true } : { settings: MESSENGER_DEFAULTS, saved: false }
  } catch {
    return null
  }
}

/** Пишет `messengerSettings` в паспорт, остальные поля и их порядок не трогает; переводы строк файла сохраняются. */
export async function saveMessengerSettings(id: string, value: MessengerSettings): Promise<boolean> {
  const file = passportFile(id)
  if (!file) return false
  const text = await readFile(file, "utf8")
  const raw = JSON.parse(text) as Record<string, unknown>
  raw.messengerSettings = value
  let out = `${JSON.stringify(raw, null, 2)}\n`
  if (text.includes("\r\n")) out = out.replace(/\n/g, "\r\n")
  const tmp = `${file}.tmp-${process.pid}`
  await writeFile(tmp, out, "utf8")
  await rename(tmp, file)
  return true
}
