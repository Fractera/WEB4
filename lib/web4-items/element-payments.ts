import "server-only"
import { readPassport, writePassportField } from "@/lib/web4-items/passport-file"

// ПЛАТЕЖИ ЭЛЕМЕНТА В ЕГО ПАСПОРТЕ (551-4). Владелец 2026-10-20: «все эти свойства должны [в] own-service-props, и его объект
// payments/web4/a2a-card/name/…. И аналогично образом нужно писать наличие или отсутствие payments/web2/tool( stripe, или
// другой)/a2a-card/name/….»; поправка того же дня: «must use web3 , web4 is another technology».
//
// Поле паспорта `payments`:
//   web3["a2a-card"][<имя карточки>] = { description, consultation, usage, commission } — карточка возможностей, оплата в USDC через сеть;
//   web2[<инструмент>] = { element, "a2a-card": { [<имя карточки>]: {} } } — подключённый платёжный элемент (551-5) и карточки, которые
//   можно оплатить через него картой (наличие ключа = да).
// 🔒 Суммы — USDC, не меньше 0 (0 — бесплатно), не больше 10 000, не точнее цента. `commission` — получать ли долю разработчика
//   (запись 51 журнала Lagrix), по умолчанию да.
// 🔒 НАРУЖУ НЕ ИДЁТ (как `messengerSettings`): публичная дверь паспорта отдаёт поля поимённо; сеть Lagrix цены пока не применяет.
// 🔒 Описание карточки пишет агент элемента по кнопке «Описать с помощью ИИ» (навык `passport-description`); дверь его не меняет.

export type CardPrices = { description: string; consultation: number; usage: number; commission: boolean }
export type ElementPayments = {
  web3?: { "a2a-card"?: Record<string, Partial<CardPrices>> }
  web2?: Record<string, { element?: string; "a2a-card"?: Record<string, Record<string, never>> }>
}

/** Владелец: «оставим только одну единственную карточку … кнопку образец» — карточка-образец. */
export const SAMPLE_CARD = "sample"
export const CARD_DEFAULTS: CardPrices = { description: "", consultation: 0, usage: 0, commission: true }

const MAX_USDC = 10000
const CARD_NAME = /^[a-z][a-z0-9-]{0,39}$/

const amount = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= MAX_USDC && Math.abs(v * 100 - Math.round(v * 100)) < 1e-6
    ? Math.round(v * 100) / 100
    : null

export type CardInput = { name: string; consultation: number; usage: number; commission: boolean }

/** Проверка карточки из тела двери; отказ называет род — `bad-card`, `bad-amount`, `bad-switch`. */
export function parseCard(body: unknown): { ok: true; value: CardInput } | { ok: false; error: "bad-card" | "bad-amount" | "bad-switch" } {
  const c = (body as { card?: Record<string, unknown> } | null)?.card
  if (!c || typeof c !== "object" || typeof c.name !== "string" || !CARD_NAME.test(c.name)) return { ok: false, error: "bad-card" }
  const consultation = amount(c.consultation)
  const usage = amount(c.usage)
  if (consultation === null || usage === null) return { ok: false, error: "bad-amount" }
  if (typeof c.commission !== "boolean") return { ok: false, error: "bad-switch" }
  return { ok: true, value: { name: c.name, consultation, usage, commission: c.commission } }
}

const asObject = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

/** Поле `payments` паспорта как есть (нет — пустой объект). */
export function paymentsOf(raw: Record<string, unknown>): ElementPayments {
  return asObject(raw.payments) as ElementPayments
}

/** Карточка из паспорта поверх умолчаний; сохранённая ли она — `saved`. */
export function cardOf(p: ElementPayments, name: string): { card: CardPrices; saved: boolean } {
  const got = p.web3?.["a2a-card"]?.[name]
  if (!got) return { card: { ...CARD_DEFAULTS }, saved: false }
  return {
    card: {
      description: typeof got.description === "string" ? got.description : "",
      consultation: amount(got.consultation) ?? 0,
      usage: amount(got.usage) ?? 0,
      commission: typeof got.commission === "boolean" ? got.commission : true,
    },
    saved: true,
  }
}

/** Платежи элемента и карточка-образец. Паспорта нет — `null`. */
export async function readPayments(id: string): Promise<{ payments: ElementPayments; sample: { card: CardPrices; saved: boolean } } | null> {
  const raw = await readPassport(id)
  if (!raw) return null
  const payments = paymentsOf(raw)
  return { payments, sample: cardOf(payments, SAMPLE_CARD) }
}

/** Сохранить цены карточки; описание (его пишет агент) и остальные части `payments` не трогаются. */
export async function saveCard(id: string, v: CardInput): Promise<boolean> {
  const raw = await readPassport(id)
  if (!raw) return false
  const p = paymentsOf(raw)
  const cards = { ...(p.web3?.["a2a-card"] ?? {}) }
  const prev = cards[v.name] ?? {}
  cards[v.name] = { description: typeof prev.description === "string" ? prev.description : "", consultation: v.consultation, usage: v.usage, commission: v.commission }
  return writePassportField(id, "payments", { ...p, web3: { ...(p.web3 ?? {}), "a2a-card": cards } })
}
