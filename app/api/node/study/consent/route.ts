// @api the consent page of a test account login window
import { NextRequest } from "next/server"
import { requireRoles } from "@/lib/auth/require-roles"
import { recordConsent, STATEMENTS } from "@/lib/study/study.mjs"

// СТРАНИЦА СОГЛАСИЯ ОКНА ВХОДА (шаг 556-6). Её открывает запускатель `scripts/study-login.mjs` первой страницей видимого окна; адрес
// несёт одноразовый ключ окна (`nonce`), поэтому чужой сайт, открытый в том же окне, не запишет согласие за человека. Три отметки и
// точное имя сайта — затем окно уходит на сам сайт, где человек входит сам. Пароль сюда не вводится и ядро его не видит никогда.
// Страница простая и без скриптов: окно — отдельный профиль браузера, вход в пульт там не нужен (человек за этим компьютером).
export const dynamic = "force-dynamic"

const WORDS = {
  en: {
    title: "A test account for the analysis",
    lead: "The node's agent will study the internal pages of this site in the account you sign in to in this window. It only reads: it never votes, posts, sends or pays. Your password stays with you — the agent never sees it.",
    type: "Type the site name to confirm:",
    go: "I confirm — open the site to sign in",
    after: "Consent recorded. Opening the site — sign in to the test account, then close this window.",
    errors: {
      "no-window": "No login window is open for this site. Open it again from the node.",
      "bad-window": "This form does not belong to the open login window. Open the window again from the node.",
      checks: "Tick all three statements.",
      typed: "Type the site name exactly as shown.",
    } as Record<string, string>,
  },
  ru: {
    title: "Тестовая учётная запись для разбора",
    lead: "Агент узла изучит внутренние страницы этого сайта в учётной записи, в которую вы войдёте в этом окне. Он только читает: не голосует, не публикует, не отправляет и не платит. Пароль остаётся у вас — агент его не видит.",
    type: "Введите имя сайта, чтобы подтвердить:",
    go: "Подтверждаю — открыть сайт для входа",
    after: "Согласие записано. Открываю сайт — войдите в тестовую учётную запись и закройте это окно.",
    errors: {
      "no-window": "Окно входа для этого сайта не открыто. Откройте его заново из узла.",
      "bad-window": "Эта форма не принадлежит открытому окну входа. Откройте окно заново из узла.",
      checks: "Отметьте все три пункта.",
      typed: "Введите имя сайта точно так, как оно написано.",
    } as Record<string, string>,
  },
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string)

function page(lang: "en" | "ru", site: string, nonce: string, error?: string) {
  const w = WORDS[lang]
  const checks = STATEMENTS[lang].map((s, i) => `<label><input type="checkbox" name="c${i}" value="1"> ${esc(s)}</label>`).join("")
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(w.title)}</title><style>
body{font:16px/1.5 system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;color:#111;background:#fff}
h1{font-size:22px} .site{font-family:ui-monospace,monospace;background:#f3f3f3;padding:2px 6px;border-radius:4px}
label{display:block;margin:10px 0} input[type=text]{font:inherit;padding:6px 8px;width:100%;box-sizing:border-box;margin-top:6px}
button{margin-top:16px;font:inherit;padding:8px 14px;cursor:pointer} .err{color:#b42318;margin-top:12px}
@media (prefers-color-scheme:dark){body{background:#111;color:#eee}.site{background:#222}}
</style></head><body>
<h1>${esc(w.title)}: <span class="site">${esc(site)}</span></h1><p>${esc(w.lead)}</p>
<form method="post">${checks}<input type="hidden" name="site" value="${esc(site)}"><input type="hidden" name="nonce" value="${esc(nonce)}">
<input type="hidden" name="lang" value="${lang}"><label>${esc(w.type)}<input type="text" name="typed" autocomplete="off"></label>
<button type="submit">${esc(w.go)}</button>${error ? `<p class="err">${esc(error)}</p>` : ""}</form></body></html>`
}

const html = (body: string, status = 200) => new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } })

export async function GET(req: NextRequest) {
  const denied = await requireRoles(req, ["architect", "admin"])
  if (denied) return denied
  const p = req.nextUrl.searchParams
  const lang = p.get("lang") === "ru" ? "ru" : "en"
  return html(page(lang, p.get("site") ?? "", p.get("nonce") ?? ""))
}

export async function POST(req: NextRequest) {
  const denied = await requireRoles(req, ["architect", "admin"])
  if (denied) return denied
  const form = await req.formData()
  const get = (k: string) => String(form.get(k) ?? "")
  const lang = get("lang") === "ru" ? "ru" : "en"
  const site = get("site")
  const r = recordConsent({ site, nonce: get("nonce"), checks: [0, 1, 2].map((i) => get(`c${i}`) === "1"), typed: get("typed"), lang })
  if (!r.ok) return html(page(lang, site, get("nonce"), WORDS[lang].errors[String(r.error ?? "")] ?? String(r.message ?? "")), 400)
  const to = esc(String(r.origin))
  return html(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta http-equiv="refresh" content="2;url=${to}/">
<title>${esc(WORDS[lang].title)}</title></head><body style="font:16px/1.5 system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px">
<p>${esc(WORDS[lang].after)}</p><p><a href="${to}/">${to}</a></p></body></html>`)
}
