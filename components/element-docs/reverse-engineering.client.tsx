"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { CircleHelp, FileText, Globe, ImagePlus, Plus, Trash2, X } from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { H2 } from "@/components/ui/typography"
import { VoiceControl } from "@/components/form/voice-control.client"
import { TerminalDrawer } from "@/_tools/terminal-drawer/client/terminal-drawer.client"
import type { TerminalDrawerWords, TerminalKit } from "@/_tools/terminal-drawer/types/terminal-drawer"

// «СТРОИТЕЛЬСТВО → ПРОЕКТИРОВАНИЕ ПРОДУКТА → РЕВЕРС-ИНЖИНИРИНГ» (539-3; страница переделана 556-9). Одна страница ядра для каждого элемента.
//
// 556-9, владелец 2026-10-23: «Представь все просто в формате карточек аккордеон», «Чтобы рассказать подробнее сделай просто ? …
// всплывающую подсказку», «Наверно нужна кнопка начать Reverse инжиниринг … берём за основу привью которые делит экран правый на две
// части и справа появляется инструмент: терминал куда автоматически подставляется необходимый текст». Отсюда:
// 1) карточки: «Адрес сайта» · «Страница N» (адрес, что важно — голосом тоже, скриншоты в хранилище узла) · «+ Добавить ещё страницу»;
// 2) «Начать реверс-инжиниринг» — справа ящик с терминалом главного агента узла (`build`), задача уходит с запуском (`_tools/terminal-drawer`);
// 3) ниже — готовые разборы. Страницы после входа — скриншоты; войти самому агент попросит в терминале (выбор владельца 2026-10-23).
// ✗ До этого: «не петля → фраза для Telegram» — ложная посылка: терминал закрыт только на временном адресе, на своём домене он работает.
// Всё читается при открытии страницы и по кнопкам — таймеров и опроса нет (запрет незаказанного поведения 2026-09-25).

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export type ReverseEngineeringWords = {
  site: { title: string; lead: string; placeholder: string; help: string }
  page: {
    /** «{n}» is replaced. */
    title: string
    lead: string
    addressPlaceholder: string
    notePlaceholder: string
    upload: string
    uploading: string
    uploadFailed: string
    removeShot: string
    remove: string
    help: string
    /** The link under the microphone when the node has no OpenAI key. */
    voiceKey: string
  }
  addPage: string
  start: string
  helpLabel: string
  /** The task for the main agent. «{target}» and «{item}» are replaced; the pages follow it line by line. */
  task: string
  taskPages: string
  /** «{n}», «{address}» are replaced. */
  taskPage: string
  taskNoAddress: string
  /** «{links}» is replaced. */
  taskShots: string
  drawer: TerminalDrawerWords
  reports: { title: string; loading: string; failed: string; empty: string; open: string; openFailed: string; kinds: Record<string, string> }
  tool: {
    title: string
    install: string
    installNote: string
    starting: string
    running: string
    check: string
    nodeOld: string
    failed: string
    retry: string
  }
}

type Shot = { id: string; url: string; name: string }
type PageInput = { key: number; address: string; note: string; shots: Shot[] }

const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (all, k: string) => values[k] ?? all)

function Help({ text, label }: { text: string; label: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label={label} data-rea-help>
          <CircleHelp className="size-4" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-xs text-sm">{text}</PopoverContent>
    </Popover>
  )
}

/** Задача главному агенту: цель, элемент и страницы — по строке на страницу, скриншоты ссылками хранилища узла. */
function composeTask(w: ReverseEngineeringWords, item: string, target: string, pages: PageInput[]): string {
  const lines = [fill(w.task, { target, item })]
  const filled = pages.filter((p) => p.address.trim() || p.note.trim() || p.shots.length)
  if (filled.length) {
    lines.push(w.taskPages)
    filled.forEach((p, i) => {
      let line = fill(w.taskPage, { n: String(i + 1), address: p.address.trim() || w.taskNoAddress })
      if (p.note.trim()) line += ` — ${p.note.trim().replace(/\s+/g, " ")}`
      if (p.shots.length) line += `. ${fill(w.taskShots, { links: p.shots.map((s) => s.url).join(" ") })}`
      lines.push(line)
    })
  }
  return lines.join("\n")
}

function PageCard({
  page,
  n,
  lang,
  item,
  w,
  helpLabel,
  keyHref,
  onChange,
  onRemove,
}: {
  page: PageInput
  n: number
  lang: string
  item: string
  w: ReverseEngineeringWords["page"]
  helpLabel: string
  keyHref: string
  onChange: (next: PageInput) => void
  onRemove: () => void
}) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    setError(false)
    const added: Shot[] = []
    for (const file of Array.from(files)) {
      try {
        const form = new FormData()
        form.append("file", file)
        form.append("title", file.name)
        const r = await fetch(`${BASE}/api/media/upload`, { method: "POST", body: form })
        const j = (await r.json().catch(() => null)) as { ok?: boolean; item?: { id: string; url: string } } | null
        if (j?.ok && j.item) added.push({ id: j.item.id, url: j.item.url, name: file.name })
        else setError(true)
      } catch {
        setError(true)
      }
    }
    if (added.length) onChange({ ...page, shots: [...page.shots, ...added] })
    setBusy(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <AccordionItem value={`page-${page.key}`} data-rea-page={n}>
      <AccordionTrigger>
        <span className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" aria-hidden />
          {fill(w.title, { n: String(n) })}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-1">
            <p className="flex-1 pt-2 text-sm text-foreground">{w.lead}</p>
            <Help text={w.help} label={helpLabel} />
          </div>
          <Input
            value={page.address}
            placeholder={w.addressPlaceholder}
            onChange={(e) => onChange({ ...page, address: e.target.value })}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            data-rea-page-address
          />
          <VoiceControl
            id={`rea-page-${page.key}-note`}
            variant="textarea"
            rows={3}
            value={page.note}
            onChange={(note) => onChange({ ...page, note })}
            lang={lang}
            placeholder={w.notePlaceholder}
            apiUrl={`${BASE}/api/transcribe?item=${encodeURIComponent(item)}`}
            keyHint={{ href: keyHref, label: w.voiceKey }}
          />
          {page.shots.length > 0 && (
            <ul className="flex flex-wrap gap-2" data-rea-shots={page.shots.length}>
              {page.shots.map((s) => (
                <li key={s.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- снимок из хранилища узла, размеры неизвестны заранее */}
                  <img src={`${BASE}/api/media/${encodeURIComponent(s.id)}/file`} alt={s.name} className="size-20 rounded-md border border-border object-cover" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute -top-2 -right-2 size-6 rounded-full"
                    aria-label={w.removeShot}
                    onClick={() => onChange({ ...page, shots: page.shots.filter((x) => x.id !== s.id) })}
                  >
                    <X className="size-3" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void upload(e.target.files)} data-rea-shot-input />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="gap-1.5" disabled={busy} onClick={() => fileRef.current?.click()} data-rea-upload>
              {busy ? <Spinner /> : <ImagePlus className="size-4" aria-hidden />}
              {busy ? w.uploading : w.upload}
            </Button>
            <Button type="button" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={onRemove} data-rea-page-remove>
              <Trash2 className="size-4" aria-hidden />
              {w.remove}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{w.uploadFailed}</p>}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

// ГОТОВЫЕ РАЗБОРЫ. Элемент `reverse` между задачами выключен, отчёты отдаёт ядро (`/api/node/reverse-report`): список — при открытии
// страницы; полный отчёт — при раскрытии строки.
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
  else if (!items.length) body = <p className="text-sm text-muted-foreground" data-rea-reports="empty">{w.empty}</p>
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
      <H2 variant="ui">{w.title}</H2>
      {body}
    </section>
  )
}

// ПРОГРАММА REA. Установлена — на странице её не видно; нет — карточка сверху, потому что без неё разбор не начнётся.
type Status = {
  installed: boolean
  version: string | null
  node: { version: string; ok: boolean }
  install: { running?: boolean; ok?: boolean; error?: string } | null
}

function ToolNotice({ t }: { t: ReverseEngineeringWords["tool"] }) {
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState(false)

  async function read() {
    try {
      const r = await fetch(`${BASE}/api/node/rea`, { cache: "no-store" })
      const j = (await r.json().catch(() => null)) as ({ ok?: boolean } & Partial<Status>) | null
      setStatus(j?.ok ? (j as Status) : null)
    } catch {
      setStatus(null)
    }
  }
  useEffect(() => {
    void read()
  }, [])

  async function install() {
    setBusy(true)
    try {
      const r = await fetch(`${BASE}/api/node/rea`, { method: "POST", cache: "no-store" })
      const j = (await r.json().catch(() => null)) as Partial<Status> | null
      if (j && j.installed !== undefined) setStatus(j as Status)
    } catch {
      /* следующее открытие страницы скажет правду */
    }
    setBusy(false)
  }

  if (!status || status.installed) return null
  let body: ReactNode
  if (status.install?.running) {
    body = (
      <div className="flex flex-wrap items-center gap-3" data-rea-state="running">
        <p className="inline-flex items-center gap-2 text-sm text-foreground"><Spinner /> {t.running}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => { setBusy(true); void read().finally(() => setBusy(false)) }} disabled={busy}>{t.check}</Button>
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
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-muted p-4" data-rea-tool-notice>
      <p className="text-sm font-medium text-foreground">{t.title}</p>
      {body}
    </section>
  )
}

export function ReverseEngineering({ item, lang, words, kit }: { item: string; lang: string; words: ReverseEngineeringWords; kit: TerminalKit }) {
  const nextKey = useRef(2)
  const [target, setTarget] = useState("")
  const [pages, setPages] = useState<PageInput[]>([{ key: 1, address: "", note: "", shots: [] }])
  const [open, setOpen] = useState<string[]>(["site"])
  const [drawer, setDrawer] = useState<{ n: number; text: string } | null>(null)

  function addPage() {
    const key = nextKey.current++
    setPages((p) => [...p, { key, address: "", note: "", shots: [] }])
    setOpen((o) => [...o, `page-${key}`])
  }

  function start() {
    const value = target.trim()
    if (!value) return
    setDrawer((d) => ({ n: (d?.n ?? 0) + 1, text: composeTask(words, item, value, pages) }))
  }

  return (
    <div className="my-4 flex flex-col gap-4 lg:flex-row lg:items-start" data-reverse-engineering>
      <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-8">
        <ToolNotice t={words.tool} />
        <div className="flex flex-col gap-4">
          <Accordion type="multiple" value={open} onValueChange={setOpen} className="rounded-lg border border-border px-4" data-rea-cards>
            <AccordionItem value="site" data-rea-site>
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" aria-hidden />
                  {words.site.title}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-1">
                    <p className="flex-1 pt-2 text-sm text-foreground">{words.site.lead}</p>
                    <Help text={words.site.help} label={words.helpLabel} />
                  </div>
                  <Input
                    value={target}
                    placeholder={words.site.placeholder}
                    onChange={(e) => setTarget(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") start() }}
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    data-rea-target
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            {pages.map((p, i) => (
              <PageCard
                key={p.key}
                page={p}
                n={i + 1}
                lang={lang}
                item={item}
                w={words.page}
                helpLabel={words.helpLabel}
                keyHref={kit.keyHref}
                onChange={(next) => setPages((all) => all.map((x) => (x.key === next.key ? next : x)))}
                onRemove={() => setPages((all) => all.filter((x) => x.key !== p.key))}
              />
            ))}
          </Accordion>
          <Button type="button" variant="outline" className="w-full justify-start gap-2 border-dashed" onClick={addPage} data-rea-add-page>
            <Plus className="size-4" aria-hidden />
            {words.addPage}
          </Button>
          <Button type="button" size="lg" className="self-start" disabled={!target.trim()} onClick={start} data-rea-start>
            {words.start}
          </Button>
        </div>
        <Reports w={words.reports} />
      </div>
      {drawer && (
        <TerminalDrawer
          key={drawer.n}
          service="build"
          lang={lang}
          words={words.drawer}
          kit={kit}
          text={drawer.text}
          start
          onCollapse={() => setDrawer(null)}
        />
      )}
    </div>
  )
}
