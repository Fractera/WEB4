"use client"

import { useEffect, useState, type ReactNode } from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

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
