"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { H2 } from "@/components/ui/typography"
import { isLoopbackHostname } from "@/lib/auth/owner-at-machine"
import { cleanPaste } from "@/app/[lang]/(architectLayer)/architect/kits/_agent-kit/core/client/terminal-paste.mjs"

// «СТРОИТЕЛЬСТВО → ПРОЕКТИРОВАНИЕ ПРОДУКТА → РЕВЕРС-ИНЖИНИРИНГ» (539-3; страница пересобрана 556-9). Одна страница ядра для каждого элемента.
//
// 556-9, владелец 2026-10-22: «Весь дизайн этой страницы сделан врагами» и «мы должны разбирать в том числе sdk». Было четыре одинаковые
// карточки с внутренностями узла (путь программы, номер задачи, заглушка проверки) и ни одного действия «что разобрать». Стало:
// 1) «Что разобрать» — сайт или SDK, поле и одна кнопка; задача уходит главному агенту узла: на машине узла — его терминал с задачей
//    в окне вставки (`?paste=`, как квиз и расписание), через интернет — фраза для его бота в Telegram (терминал по сети закрыт);
// 2) «Готовые разборы» — что разобрано, вид и дата словами; отчёт раскрывается на месте;
// 3) «Страницы после входа» — вход человека в отдельную учётную запись (556-6): поле видно при любом адресе страницы;
// 4) «Как это работает» — свёрнутые разделы; состояние программы REA — одной строкой, а если её нет — предупреждение сверху.
// Всё читается при открытии страницы и по кнопкам — таймеров и опроса нет (запрет незаказанного поведения 2026-09-25).

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export type ReverseEngineeringWords = {
  /** 556-9: the one action of the page — a site or an SDK to study. «{target}» is replaced in the tasks. */
  start: {
    title: string
    lead: string
    kinds: { site: string; sdk: string }
    siteLabel: string
    sitePlaceholder: string
    siteHelp: string
    sdkLabel: string
    sdkPlaceholder: string
    sdkHelp: string
    button: string
    taskSite: string
    taskSdk: string
    remote: string
    copy: string
    copied: string
    copyFailed: string
  }
  /** The node's finished studies — the door /api/node/reverse-report. */
  reports: { title: string; lead: string; loading: string; failed: string; empty: string; open: string; openFailed: string; kinds: Record<string, string> }
  /** 556-6/556-9: pages behind a sign-in — the door /api/node/study. «{date}» and «{error}» are replaced. */
  study: {
    title: string
    lead: string
    steps: string[]
    note: string
    loading: string
    failed: string
    empty: string
    siteLabel: string
    sitePlaceholder: string
    open: string
    opening: string
    opened: string
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
  aboutTitle: string
  sections: { id: string; title: string; paragraphs: string[]; list?: { lead: string; items: string[] } }[]
  tool: {
    title: string
    lead: string
    loading: string
    loadFailed: string
    installed: string
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
}

const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (all, k: string) => values[k] ?? all)
const day = (iso: string) => iso.slice(0, 16).replace("T", " ")
const inputClass = "h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

function Heading({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <H2 variant="ui">{title}</H2>
      {lead && <p className="max-w-prose text-sm text-muted-foreground">{lead}</p>}
    </div>
  )
}

// 1. ЧТО РАЗОБРАТЬ. Задача — словами шаблона (сайт или SDK) и тем, что вписал человек; разбор ведёт главный агент узла (его навык
// `reverse-engineer`: правила сайта, включение элемента на задачу, отчёт, выключение).
function Start({ w }: { w: ReverseEngineeringWords["start"] }) {
  const [kind, setKind] = useState<"site" | "sdk">("site")
  const [target, setTarget] = useState("")
  const [phrase, setPhrase] = useState<string | null>(null)
  const [copyNote, setCopyNote] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const value = target.trim()
    if (!value) return
    const text = fill(kind === "site" ? w.taskSite : w.taskSdk, { target: value })
    if (isLoopbackHostname(window.location.hostname)) {
      const lang = document.documentElement.lang || "en"
      window.location.href = `${BASE}/${lang}/build/terminal?paste=${encodeURIComponent(cleanPaste(text))}`
      return
    }
    setPhrase(text)
    setCopyNote(null)
  }

  async function copy() {
    if (!phrase) return
    try {
      await navigator.clipboard.writeText(phrase)
      setCopyNote(w.copied)
    } catch {
      setCopyNote(w.copyFailed)
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5" data-rea-start>
      <Heading title={w.title} lead={w.lead} />
      <Tabs value={kind} onValueChange={(v) => { setKind(v === "sdk" ? "sdk" : "site"); setPhrase(null) }}>
        <TabsList>
          <TabsTrigger value="site" data-rea-kind="site">{w.kinds.site}</TabsTrigger>
          <TabsTrigger value="sdk" data-rea-kind="sdk">{w.kinds.sdk}</TabsTrigger>
        </TabsList>
      </Tabs>
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={submit} data-rea-start-form>
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-foreground">
          {kind === "site" ? w.siteLabel : w.sdkLabel}
          <input
            className={inputClass}
            value={target}
            placeholder={kind === "site" ? w.sitePlaceholder : w.sdkPlaceholder}
            onChange={(e) => setTarget(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <Button type="submit" disabled={!target.trim()} data-rea-start-button>{w.button}</Button>
      </form>
      <p className="max-w-prose text-sm text-muted-foreground">{kind === "site" ? w.siteHelp : w.sdkHelp}</p>
      {phrase && (
        <div className="flex flex-col gap-2 rounded-md bg-muted p-3 text-sm text-foreground" role="status" data-rea-phrase>
          <p>{w.remote}</p>
          <p className="break-words font-mono">{phrase}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>{w.copy}</Button>
            {copyNote && <span className="text-muted-foreground">{copyNote}</span>}
          </div>
        </div>
      )}
    </section>
  )
}

// 2. ГОТОВЫЕ РАЗБОРЫ. Элемент `reverse` между задачами выключен, отчёты отдаёт ядро (`/api/node/reverse-report`): список с тем, что
// разобрано, — при открытии страницы; полный отчёт — при раскрытии строки.
type ReportItem = { job: string; target: string; kind: string; summary: string }
type ReportView = { markdown: string | null } | "loading" | "failed"

function Reports({ w }: { w: ReverseEngineeringWords["reports"] }) {
  const [items, setItems] = useState<ReportItem[] | "loading" | "failed">("loading")
  const [views, setViews] = useState<Record<string, ReportView>>({})

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch(`${BASE}/api/node/reverse-report`, { cache: "no-store" })
        const j = (await r.json().catch(() => null)) as { ok?: boolean; items?: ReportItem[] } | null
        setItems(j?.ok ? (j.items ?? []) : "failed")
      } catch {
        setItems("failed")
      }
    })()
  }, [])

  async function open(job: string) {
    if (!job || views[job]) return
    setViews((v) => ({ ...v, [job]: "loading" }))
    try {
      const r = await fetch(`${BASE}/api/node/reverse-report?job=${encodeURIComponent(job)}`, { cache: "no-store" })
      const j = (await r.json().catch(() => null)) as { ok?: boolean; markdown?: string | null } | null
      setViews((v) => ({ ...v, [job]: j?.ok ? { markdown: j.markdown ?? null } : "failed" }))
    } catch {
      setViews((v) => ({ ...v, [job]: "failed" }))
    }
  }

  let body: ReactNode
  if (items === "loading") body = <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> {w.loading}</p>
  else if (items === "failed") body = <p className="text-sm text-destructive" role="alert">{w.failed}</p>
  else if (!items.length) body = <p className="max-w-prose text-sm text-muted-foreground" data-rea-reports="empty">{w.empty}</p>
  else body = (
    <Accordion type="single" collapsible className="rounded-md border border-border px-3" onValueChange={(v) => void open(v)} data-rea-reports={items.length}>
      {items.map((it, i) => {
        const v = views[it.job]
        const date = /^\d{4}-\d{2}-\d{2}/.test(it.job) ? it.job.slice(0, 10) : ""
        return (
          <AccordionItem key={it.job} value={it.job} className={i === items.length - 1 ? "border-b-0" : undefined} data-rea-report={it.job}>
            <AccordionTrigger>
              <span className="flex min-w-0 flex-wrap items-center gap-2 text-left">
                <span className="break-all font-medium text-foreground">{it.target || it.job}</span>
                <Badge variant="secondary">{w.kinds[it.kind] ?? w.kinds.other}</Badge>
                {date && <span className="text-xs text-muted-foreground">{date}</span>}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3 text-sm text-foreground">
                {it.summary && <p className="max-w-prose">{it.summary}</p>}
                {v === undefined || v === "loading" ? (
                  <p className="inline-flex items-center gap-2 text-muted-foreground"><Spinner /> {w.open}</p>
                ) : v === "failed" ? (
                  <p className="text-destructive" role="alert">{w.openFailed}</p>
                ) : (
                  v.markdown && <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs leading-relaxed">{v.markdown}</pre>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )

  return (
    <section className="flex flex-col gap-3" data-rea-reports-section>
      <Heading title={w.title} lead={w.lead} />
      {body}
    </section>
  )
}

// 3. СТРАНИЦЫ ПОСЛЕ ВХОДА (556-6). Агент смотрит их только в отдельной учётной записи, которую человек подтвердил лично (владелец
// 2026-10-22). Окно входа открывается на экране компьютера узла при ЛЮБОМ адресе этой страницы; логин и пароль вводятся только на самом
// сайте, в окне, — полей для них здесь нет намеренно.
type StudyAccount = {
  site: string
  consent: { at: string } | null
  session: { at: string; valid: boolean } | null
  window: { open: boolean } | null
}

function StudyAccounts({ w }: { w: ReverseEngineeringWords["study"] }) {
  const [accounts, setAccounts] = useState<StudyAccount[] | "loading" | "failed">("loading")
  const [site, setSite] = useState("")
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

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

  let list: ReactNode = null
  if (accounts === "loading") list = <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> {w.loading}</p>
  else if (accounts === "failed") list = <p className="text-sm text-destructive" role="alert">{w.failed}</p>
  else if (!accounts.length) list = <p className="text-sm text-muted-foreground" data-study-accounts="empty">{w.empty}</p>
  else list = (
    <ul className="flex flex-col divide-y divide-border rounded-md border border-border" data-study-accounts={accounts.length}>
      {accounts.map((a) => (
        <li key={a.site} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm" data-study-account={a.site}>
          <span className="font-mono text-foreground">{a.site}</span>
          <Badge variant={a.session?.valid ? "default" : "secondary"}>
            {a.session ? (a.session.valid ? fill(w.signedIn, { date: day(a.session.at) }) : w.notValid) : w.notSignedIn}
          </Badge>
          <span className="text-xs text-muted-foreground">{a.consent ? fill(w.consent, { date: day(a.consent.at) }) : w.noConsent}</span>
          {a.window?.open && <Badge variant="outline">{w.windowOpen}</Badge>}
          <Button
            className="ml-auto"
            size="sm"
            variant={confirming === a.site ? "destructive" : "ghost"}
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
    <section className="flex flex-col gap-4" data-study-section>
      <Heading title={w.title} lead={w.lead} />
      <ol className="flex max-w-prose list-decimal flex-col gap-1.5 pl-5 text-sm text-foreground" data-study-steps>
        {w.steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        data-study-form
        onSubmit={(e) => { e.preventDefault(); if (site.trim()) void act("open", site.trim()) }}
      >
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-foreground">
          {w.siteLabel}
          <input className={inputClass} value={site} placeholder={w.sitePlaceholder} onChange={(e) => setSite(e.target.value)} autoComplete="off" spellCheck={false} />
        </label>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary" disabled={busy || !site.trim()}>{w.open}</Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => void load()}>{w.refresh}</Button>
        </div>
      </form>
      <p className="max-w-prose text-sm text-muted-foreground">{w.note}</p>
      {note && <p className="text-sm text-foreground" role="status">{note}</p>}
      {list}
    </section>
  )
}

type Status = {
  installed: boolean
  version: string | null
  node: { version: string; ok: boolean }
  install: { running?: boolean; ok?: boolean; error?: string } | null
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

  // Программа REA: установлена — одна строка внизу; нет — предупреждение сверху, потому что без неё разбор не начнётся.
  let notice: ReactNode = null
  let toolLine: ReactNode = null
  if (status === "loading") {
    toolLine = <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Spinner /> {t.loading}</p>
  } else if ("error" in status) {
    toolLine = <p className="text-xs text-destructive" role="alert" data-rea-error={status.error}>{t.errors[status.error] ?? t.loadFailed}</p>
  } else if (status.installed) {
    toolLine = <p className="text-xs text-muted-foreground" data-rea-state="installed">{fill(t.installed, { version: status.version ?? "" })}</p>
  } else {
    let body: ReactNode
    if (status.install?.running) {
      body = (
        <div className="flex flex-wrap items-center gap-3" data-rea-state="running">
          <p className="inline-flex items-center gap-2 text-sm text-foreground"><Spinner /> {t.running}</p>
          <Button type="button" variant="outline" size="sm" onClick={check} disabled={busy} data-rea-check>{t.check}</Button>
        </div>
      )
    } else if (!status.node.ok) {
      body = <p className="text-sm text-destructive" role="alert" data-rea-state="node-too-old">{fill(t.nodeOld, { version: status.node.version })}</p>
    } else {
      const failed = status.install && status.install.ok === false
      body = (
        <div className="flex flex-wrap items-center gap-3" data-rea-state={failed ? "failed" : "not-installed"}>
          <Button type="button" onClick={install} disabled={busy} data-rea-install>{busy ? t.starting : failed ? t.retry : t.install}</Button>
          <p className="text-sm text-muted-foreground">{failed ? fill(t.failed, { error: status.install?.error ?? "" }) : t.installNote}</p>
        </div>
      )
    }
    notice = (
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-muted p-5" data-rea-tool-notice>
        <Heading title={t.title} lead={t.lead} />
        {body}
      </section>
    )
  }

  return (
    <div className="my-4 flex max-w-3xl flex-col gap-10" data-reverse-engineering>
      {notice}
      <Start w={words.start} />
      <Reports w={words.reports} />
      <StudyAccounts w={words.study} />
      <section className="flex flex-col gap-3" data-rea-about>
        <Heading title={words.aboutTitle} />
        <Accordion type="single" collapsible className="rounded-md border border-border px-3">
          {words.sections.map((s, i) => (
            <AccordionItem key={s.id} value={s.id} className={i === words.sections.length - 1 ? "border-b-0" : undefined} data-rea-section={s.id}>
              <AccordionTrigger>{s.title}</AccordionTrigger>
              <AccordionContent>
                <div className="flex max-w-prose flex-col gap-3 text-sm leading-relaxed text-foreground">
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
        {toolLine}
      </section>
    </div>
  )
}
