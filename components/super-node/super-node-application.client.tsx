"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import type { SuperNodeWords } from "./super-node.i18n"

// «СУПЕР УЗЕЛ» — ЗАЯВКА (530-3): состояние (нет · подана, ждёт одобрения · одобрена, ждёт интеграции), подать и отозвать. Заявка — от
// кошелька узла (док. Lagrix 05 §5.6): без него — ссылка на «Главный кошелёк». Узел хранит заявку у себя; «одобрена» пишет будущий
// клиент сети. Состояние спрашивается при открытии у `/api/node/super-node`; опроса нет.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
type App = { status: "submitted" | "approved"; wallet: string; at: string } | null

export function SuperNodeApplication({ lang, words }: { lang: string; words: SuperNodeWords }) {
  const [state, setState] = useState<"loading" | "failed" | "ready">("loading")
  const [app, setApp] = useState<App>(null)
  const [wallet, setWallet] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${BASE}/api/node/super-node`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { ok?: boolean; application?: App; wallet?: string | null }) => {
        if (!j.ok) { setState("failed"); return }
        setApp(j.application ?? null); setWallet(j.wallet ?? null); setState("ready")
      })
      .catch(() => setState("failed"))
  }, [])

  async function send(action: "apply" | "withdraw") {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`${BASE}/api/node/super-node`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) })
      const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string; application?: App; wallet?: string | null } | null
      if (j?.ok) { setApp(j.application ?? null); setWallet(j.wallet ?? null) }
      else setError(`${words.failed} ${words.errors[j?.error ?? ""] ?? j?.error ?? r.status}`)
    } catch {
      setError(words.failed)
    }
    setBusy(false)
  }

  const status = app ? app.status : "none"
  const date = (iso: string) => new Date(iso).toLocaleString(lang === "ru" ? "ru-RU" : "en-GB", { dateStyle: "medium", timeStyle: "short" })
  return (
    <Card className="my-4 max-w-3xl" data-super-node-application={state === "ready" ? status : state}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-xl font-semibold">
          {state === "ready" ? words.status[status] : words.loading}
          {state === "ready" && app && <Badge variant={app.status === "approved" ? "default" : "secondary"}>{date(app.at)}</Badge>}
        </CardTitle>
        {state === "ready" && app && <CardDescription>{words.statusNote[app.status]}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {state === "loading" && <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> {words.loading}</p>}
        {state === "failed" && <p className="text-sm text-destructive" role="alert">{words.loadFailed}</p>}
        {state === "ready" && !wallet && !app && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-sm text-foreground">{words.noWallet}</p>
            <a href={`${BASE}/${lang}/passport/wallet`} className={buttonVariants({ size: "sm" })}>{words.walletLink}</a>
          </div>
        )}
        {state === "ready" && (
          <div className="flex flex-wrap items-center gap-3">
            {!app && <Button type="button" onClick={() => send("apply")} disabled={busy || !wallet} data-super-node-apply>{busy ? words.busy : words.apply}</Button>}
            {app && <Button type="button" variant="outline" onClick={() => send("withdraw")} disabled={busy} data-super-node-withdraw>{busy ? words.busy : words.withdraw}</Button>}
            <a href={`${BASE}/${lang}/super-node/notices`} className={buttonVariants({ variant: "outline", size: "sm" })}>{words.checkLink}</a>
          </div>
        )}
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      </CardContent>
    </Card>
  )
}
