import "server-only"
import { readVar, setNames, STRIPE_NAMES, type StripeName, writeVar } from "@/lib/env-file"

// КЛЮЧИ STRIPE ЦЕЛИ — ЯДРА ИЛИ ЭЛЕМЕНТА (530-1). Владелец 2026-10-18: «На вкладке настройки создать вкладку платежи … веб два и web3 в
// одной у нас будет настраиваться страйп». Web2 — приём карт сайтом: ключи аккаунта Stripe человека в `.env.local` цели.
//
// 🔒 ЗНАЧЕНИЯ НАРУЖУ НЕ УХОДЯТ НИКОГДА — ни на страницу, ни в ответ двери: только имена заданных и режим (test/live) по приставке.
// 🔒 СЕКРЕТНЫЙ КЛЮЧ ПРОВЕРЯЕТСЯ НАСТОЯЩИМ ВЫЗОВОМ STRIPE ДО ЗАПИСИ (`GET /v1/balance`): формат не доказывает, что ключ живой (тот же закон,
// что у ключа OpenAI, 336-1). Отказ — файл не тронут. Публикуемый ключ и секрет вебхука проверяются форматом.
// 🔒 КОД ПРИЁМА ПЛАТЕЖЕЙ ЗДЕСЬ НЕ ЖИВЁТ: элемент строит его сам и читает эти переменные при старте — новый ключ действует после
// перезапуска элемента. В `.env.example` элемента ничего не добавлено: пример выводится из кода, а код Stripe пока не читает.

export type StripeInput = { secretKey?: string; publishableKey?: string; webhookSecret?: string }
export type StripeMode = "test" | "live" | null

const SECRET = /^(sk|rk)_(test|live)_[A-Za-z0-9]{10,250}$/
const PUBLISHABLE = /^pk_(test|live)_[A-Za-z0-9]{10,250}$/
const WEBHOOK = /^whsec_[A-Za-z0-9+/=]{10,250}$/

const modeOf = (key: string): StripeMode => (key.includes("_live_") ? "live" : key.includes("_test_") ? "test" : null)

/** Что задано у цели: имена и режим секретного ключа. Значений нет. */
export function stripeState(target: string): { set: StripeName[]; mode: StripeMode } {
  const set = setNames(target).filter((n): n is StripeName => (STRIPE_NAMES as readonly string[]).includes(n))
  return { set, mode: modeOf(readVar(target, "STRIPE_SECRET_KEY")) }
}

/** Проверка тела: формат каждого поданного ключа и один режим у секретного и публикуемого. Отказ называет род. */
export function parseStripe(body: unknown): { ok: true; value: StripeInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>
  const pick = (k: string) => (typeof b[k] === "string" && (b[k] as string).trim() !== "" ? (b[k] as string).trim() : undefined)
  const secretKey = pick("secretKey")
  const publishableKey = pick("publishableKey")
  const webhookSecret = pick("webhookSecret")
  if (!secretKey && !publishableKey && !webhookSecret) return { ok: false, error: "empty" }
  if (secretKey && !SECRET.test(secretKey)) return { ok: false, error: "bad-secret" }
  if (publishableKey && !PUBLISHABLE.test(publishableKey)) return { ok: false, error: "bad-publishable" }
  if (webhookSecret && !WEBHOOK.test(webhookSecret)) return { ok: false, error: "bad-webhook" }
  if (secretKey && publishableKey && modeOf(secretKey) !== modeOf(publishableKey)) return { ok: false, error: "mode-mismatch" }
  return { ok: true, value: { secretKey, publishableKey, webhookSecret } }
}

/** Живой ли секретный ключ: 200 — да; 403 — ключ настоящий, но без права на баланс (ограниченный); 401 — отвергнут. */
export async function probeStripe(key: string): Promise<"ok" | "key-rejected" | "probe-failed"> {
  try {
    const r = await fetch("https://api.stripe.com/v1/balance", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) })
    if (r.ok || r.status === 403) return "ok"
    return r.status === 401 ? "key-rejected" : "probe-failed"
  } catch {
    return "probe-failed"
  }
}

/** Записать поданные ключи в `.env.local` цели (только после проверки). */
export function saveStripe(target: string, v: StripeInput): boolean {
  const pairs: [StripeName, string | undefined][] = [
    ["STRIPE_SECRET_KEY", v.secretKey],
    ["STRIPE_PUBLISHABLE_KEY", v.publishableKey],
    ["STRIPE_WEBHOOK_SECRET", v.webhookSecret],
  ]
  for (const [name, value] of pairs) if (value && !writeVar(target, name, value)) return false
  return true
}
