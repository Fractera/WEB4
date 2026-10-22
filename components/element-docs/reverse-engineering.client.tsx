"use client"

import { useEffect, useState, type ReactNode } from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { isLoopbackHostname } from "@/lib/auth/owner-at-machine"

// «СТРОИТЕЛЬСТВО → ПРОЕКТИРОВАНИЕ ПРОДУКТА → РЕВЕРС-ИНЖИНИРИНГ» (539-3). Одна страница ядра для каждого элемента.
//
// 🔒 ПОДРОБНОЕ ОПИСАНИЕ — В СВЁРНУТОМ АККОРДЕОНЕ (владелец 2026-10-19: «на каждом элементе для этой вкладки нужно сделать
// достаточно качественная подробное описание которое будет скрыто в аккордеон»). Полосы закрыты при открытии страницы; одна
// открытая за раз.
// 🔒 КАРТОЧКА «REA В ЯДРЕ» спрашивает дверь `/api/node/rea` при открытии и по кнопке «Проверить» — таймеров и опроса нет
// (запрет незаказанного поведения 2026-09-25). Установка — одна на узел, все элементы видят одну и ту же копию.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export type ReverseEngineeringWords = {
  aboutTitle: string
  sections: { id: string; title: string; paragraphs: string[]; list?: { lead: string; items: string[] } }[]
  tool: {
    title: string
    lead: string
    loading: string
    loadFailed: string
    installed: string
    installedNote: string
    where: string
    notInstalled: string
    install: string
    installNote: string
    starting: string
    running: string
    check: string
    nodeOld: string
    failed: string
    retry: string
    errors: Record<string, string>
  }
  /** 563-5: the reports of the node's analyses — the door /api/node/reverse-report. */
  reports: { title: string; lead: string; loading: string; failed: string; empty: string; target: string; open: string; openFailed: string }
  /** 556-6: test accounts for the study of internal pages — the door /api/node/study. «{date}» and «{error}» are replaced. */
  study: {
    title: string
    lead: string
    loading: string
    failed: string
    empty: string
    siteLabel: string
    sitePlaceholder: string
    open: string
    opening: string
    opened: string
    onlyHere: string
    consent: string
    noConsent: string
    signedIn: string
    notSignedIn: string
    notValid: string
    windowOpen: string
    end: string
    endConfirm: string
    refresh: string
    failedAction: string
  }
}

type ReportView = { summary: string; target: string; markdown: string | null } | "loading" | "failed"

// 563-5: ОТЧЁТЫ РАЗБОРА. Элемент `reverse` между задачами выключен, отчёты отдаёт ядро (`/api/node/reverse-report`). Список читается при
// открытии страницы, отчёт — при раскрытии строки; таймеров и опроса нет (запрет незаказанного поведения 2026-09-25).
function Reports({ w }: { w: ReverseEngineeringWords["reports"] }) {
  const [jobs, setJobs] = useState<string[] | "loading" | "failed">("loading")
  const [views, setViews] = useState<Record<string, ReportView>>({})

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch(`${BASE}/api/node/reverse-report`, { cache: "no-store" })
        const j = (await r.json().catch(() => null)) as { ok?: boolean; jobs?: string[] } | null
        setJobs(j?.ok ? (j.jobs ?? []) : "failed")
      } catch {
        setJobs("failed")
      }
    })()
  }, [])

  async function open(job: string) {
    if (!job || views[job]) return
    setViews((v) => ({ ...v, [job]: "loading" }))
    try {
      const r = await fetch(`${BASE}/api/node/reverse-report?job=${encodeURIComponent(job)}`, { cache: "no-store" })
      const j = (await r.json().catch(() => null)) as { ok?: boolean; report?: { summary?: string; target?: { source?: string; name?: string } }; markdown?: string | null } | null
      setViews((v) => ({ ...v, [job]: j?.ok ? { summary: j.report?.summary ?? "", target: j.report?.target?.source || j.report?.target?.name || "", markdown: j.markdown ?? null } : "failed" }))
    } catch {
      setViews((v) => ({ ...v, [job]: "failed" }))
    }
  }

  let body: ReactNode
  if (jobs === "loading") body = <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> {w.loading}</p>
  else if (jobs === "failed") body = <p className="text-sm text-destructive" role="alert">{w.failed}</p>
  else if (!jobs.length) body = <p className="text-sm text-muted-foreground" data-rea-reports="empty">{w.empty}</p>
  else body = (
    <Accordion type="single" collapsible className="rounded-md border border-border px-3" onValueChange={(v) => void open(v)} data-rea-reports={jobs.length}>
      {jobs.map((job, i) => {
        const v = views[job]
        return (
          <AccordionItem key={job} value={job} className={i === jobs.length - 1 ? "border-b-0" : undefined} data-rea-report={job}>
            <AccordionTrigger><span className="font-mono">{job}</span></AccordionTrigger>
            <AccordionContent>
              {v === undefined || v === "loading" ? (
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> {w.open}</p>
              ) : v === "failed" ? (
                <p className="text-sm text-destructive" role="alert">{w.openFailed}</p>
              ) : (
                <div className="flex flex-col gap-2 text-sm text-foreground">
                  {v.target && <p className="text-muted-foreground">{w.target}: <span className="break-all font-mono">{v.target}</span></p>}
                  {v.summary && <p>{v.summary}</p>}
                  {v.markdown && <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-[length:var(--fs-small)]">{v.markdown}</pre>}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{w.title}</CardTitle>
        <CardDescription>{w.lead}</CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}

type Status = {
  installed: boolean
  version: string | null
  wanted: string
  dir: string
  node: { version: string; ok: boolean }
  install: { running?: boolean; ok?: boolean; error?: string } | null
}

function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? `{${k}}`)
}

type StudyAccount = {
  site: string
  consent: { at: string } | null
  session: { at: string; valid: boolean } | null
  window: { open: boolean } | null
}

// 556-6: ТЕСТОВЫЕ УЧЁТНЫЕ ЗАПИСИ. Агент смотрит внутренние страницы сайта только в учётной записи, которую человек подтвердил лично
// (владелец 2026-10-22). Окно входа открывается только на машине узла: человек отмечает три пункта, вводит имя сайта и входит сам.
// Список читается при открытии и по кнопке «Обновить» — таймеров и опроса нет (запрет незаказанного поведения 2026-09-25).
function StudyAccounts({ w }: { w: ReverseEngineeringWords["study"] }) {
  const [accounts, setAccounts] = useState<StudyAccount[] | "loading" | "failed">("loading")
  const [site, setSite] = useState("")
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [here, setHere] = useState(false)
  const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (all, k: string) => values[k] ?? all)
  const day = (iso: string) => iso.slice(0, 16).replace("T", " ")

  async function load() {
    try {
      const r = await fetch(`${BASE}/api/node/study`, { cache: "no-store" })
      const j = (await r.json().catch(() => null)) as { ok?: boolean; accounts?: StudyAccount[] } | null
      setAccounts(j?.ok ? (j.accounts ?? []) : "failed")
    } catch {
      setAccounts("failed")
    }
  }
  useEffect(() => {
    setHere(isLoopbackHostname(window.location.hostname))
    void load()
  }, [])

  async function act(action: "open" | "end", target: string) {
    setBusy(true)
    setNote(action === "open" ? w.opening : null)
    try {
      const r = await fetch(`${BASE}/api/node/study`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, site: target, lang: document.documentElement.lang }),
      })
      const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!j?.ok) setNote(fill(w.failedAction, { error: j?.error ?? String(r.status) }))
      else setNote(action === "open" ? w.opened : null)
    } catch {
      setNote(fill(w.failedAction, { error: "network" }))
    } finally {
      setBusy(false)
      setConfirming(null)
      await load()
    }
  }

  let list: ReactNode
  if (accounts === "loading") list = <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> {w.loading}</p>
  else if (accounts === "failed") list = <p className="text-sm text-destructive" role="alert">{w.failed}</p>
  else if (!accounts.length) list = <p className="text-sm text-muted-foreground" data-study-accounts="empty">{w.empty}</p>
  else list = (
    <ul className="flex flex-col gap-2" data-study-accounts={accounts.length}>
      {accounts.map((a) => (
        <li key={a.site} className="flex flex-wrap items-center gap-2 text-sm" data-study-account={a.site}>
          <span className="font-mono">{a.site}</span>
          <Badge variant="outline">{a.consent ? fill(w.consent, { date: day(a.consent.at) }) : w.noConsent}</Badge>
          <Badge variant={a.session?.valid ? "default" : "secondary"}>
            {a.session ? (a.session.valid ? fill(w.signedIn, { date: day(a.session.at) }) : w.notValid) : w.notSignedIn}
          </Badge>
          {a.window?.open && <Badge variant="outline">{w.windowOpen}</Badge>}
          <Button
            size="sm"
            variant={confirming === a.site ? "destructive" : "outline"}
            disabled={busy}
            onClick={() => (confirming === a.site ? void act("end", a.site) : setConfirming(a.site))}
          >
            {confirming === a.site ? w.endConfirm : w.end}
          </Button>
        </li>
      ))}
    </ul>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{w.title}</CardTitle>
        <CardDescription>{w.lead}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {list}
        {here ? (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => { e.preventDefault(); if (site.trim()) void act("open", site.trim()) }}
          >
            <label className="flex flex-col gap-1 text-sm">
              {w.siteLabel}
              <input
                className="rounded-md border border-border bg-background px-2 py-1 font-mono"
                value={site}
                placeholder={w.sitePlaceholder}
                onChange={(e) => setSite(e.target.value)}
              />
            </label>
            <Button type="submit" size="sm" disabled={busy || !site.trim()}>{w.open}</Button>
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void load()}>{w.refresh}</Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">{w.onlyHere}</p>
        )}
        {note && <p className="text-sm text-muted-foreground" role="status">{note}</p>}
      </CardContent>
    </Card>
  )
}

export function ReverseEngineering({ words }: { words: ReverseEngineeringWords }) {
  const t = words.tool
  const [status, setStatus] = useState<Status | "loading" | { error: string }>("loading")
  const [busy, setBusy] = useState(false)

  async function read() {
    try {
      const r = await fetch(`${BASE}/api/node/rea`, { cache: "no-store" })
      const j = (await r.json().catch(() => null)) as ({ ok?: boolean; error?: string } & Partial<Status>) | null
      setStatus(j?.ok ? (j as Status) : { error: j?.error ?? String(r.status) })
    } catch {
      setStatus({ error: "network" })
    }
  }

  useEffect(() => {
    void read()
  }, [])

  async function install() {
    setBusy(true)
    try {
      const r = await fetch(`${BASE}/api/node/rea`, { method: "POST", cache: "no-store" })
      const j = (await r.json().catch(() => null)) as ({ ok?: boolean; error?: string } & Partial<Status>) | null
      if (j && j.installed !== undefined) setStatus(j as Status)
      else setStatus({ error: j?.error ?? String(r.status) })
    } catch {
      setStatus({ error: "network" })
    }
    setBusy(false)
  }

  async function check() {
    setBusy(true)
    await read()
    setBusy(false)
  }

  let body: ReactNode
  if (status === "loading") {
    body = <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> {t.loading}</p>
  } else if ("error" in status) {
    body = <p className="text-sm text-destructive" role="alert" data-rea-error={status.error}>{t.errors[status.error] ?? t.loadFailed}</p>
  } else if (status.installed) {
    body = (
      <div className="flex flex-col gap-2" data-rea-state="installed">
        <p className="flex items-center gap-2 text-sm text-foreground">
          <Badge variant="secondary">{fill(t.installed, { version: status.version ?? "" })}</Badge>
        </p>
        <p className="text-sm text-foreground">{t.installedNote}</p>
        <p className="text-[length:var(--fs-small)] text-muted-foreground">
          {t.where}: <span className="break-all font-mono">{status.dir}</span>
        </p>
      </div>
    )
  } else if (status.install?.running) {
    body = (
      <div className="flex flex-wrap items-center gap-3" data-rea-state="running">
        <p className="inline-flex items-center gap-2 text-sm text-foreground"><Spinner /> {t.running}</p>
        <Button type="button" variant="outline" onClick={check} disabled={busy} data-rea-check>{t.check}</Button>
      </div>
    )
  } else if (!status.node.ok) {
    body = <p className="text-sm text-destructive" role="alert" data-rea-state="node-too-old">{fill(t.nodeOld, { version: status.node.version })}</p>
  } else {
    const failed = status.install && status.install.ok === false
    body = (
      <div className="flex flex-col gap-3" data-rea-state={failed ? "failed" : "not-installed"}>
        <p className="text-sm text-foreground">{failed ? fill(t.failed, { error: status.install?.error ?? "" }) : t.notInstalled}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={install} disabled={busy} data-rea-install>{busy ? t.starting : failed ? t.retry : t.install}</Button>
          <p className="text-[length:var(--fs-small)] text-muted-foreground">{t.installNote}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="my-4 flex max-w-3xl flex-col gap-4" data-reverse-engineering>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{t.title}</CardTitle>
          <CardDescription>{t.lead}</CardDescription>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
      <Reports w={words.reports} />
      <StudyAccounts w={words.study} />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{words.aboutTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="rounded-md border border-border px-3" data-rea-about>
            {words.sections.map((s, i) => (
              <AccordionItem key={s.id} value={s.id} className={i === words.sections.length - 1 ? "border-b-0" : undefined} data-rea-section={s.id}>
                <AccordionTrigger>{s.title}</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground">
                    {s.paragraphs.map((p) => <p key={p}>{p}</p>)}
                    {s.list && (
                      <div className="flex flex-col gap-1">
                        <p>{s.list.lead}</p>
                        <ul className="list-disc space-y-1 pl-5">{s.list.items.map((x) => <li key={x}>{x}</li>)}</ul>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
