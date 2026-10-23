"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Check, CircleHelp, FileText, Globe, ImagePlus, Plus, RefreshCw, Trash2, X } from "lucide-react"

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
// Всё читается при открытии страницы и по кнопкам — таймеров и опроса нет (запрет незаказанного поведения 2026-09-25). 556-13: пока
// открыт ящик, который открыл человек, страница слушает поток «решение записано» (план согласован владельцем: «go»).

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
  /** 556-11: the drawer with the element's agent («Send to the product quiz»). */
  drawerElement: TerminalDrawerWords
  reports: {
    title: string
    loading: string
    failed: string
    empty: string
    open: string
    openFailed: string
    kinds: Record<string, string>
    /** 556-11: the decision under a study and its buttons. */
    analyze: string
    analyzeAgain: string
    verdictTitle: string
    verdictPages: string
    continueStudy: string
    toQuiz: string
    refresh: string
    /** The task for the main agent. «{job}», «{target}», «{item}» are replaced. */
    taskAnalyze: string
    /** The task for the element's agent. «{job}», «{target}» are replaced. */
    taskQuiz: string
    /** 556-13: the wide «Continue the study» — the task for the main agent. «{job}», «{target}», «{item}» are replaced. */
    taskContinue: string
    /** Appended when the decision needs a sign-in. «{site}» is replaced. */
    taskContinueAccount: string
    /** The line above the wide button. «{target}», «{date}» are replaced. */
    decisionOf: string
    /** 556-15: the badge of a series in one row («parts 1–{n}») and the head of each part («Part {n}»). */
    parts: string
    partTitle: string
    /** 556-13: the orange card «sign in to the test account». «{site}» is replaced everywhere. */
    signIn: {
      title: string
      steps: string[]
      help: string
      open: string
      opening: string
      check: string
      states: { loading: string; none: string; window: string; consent: string; done: string; failed: string }
    }
  }
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
  mediaLink,
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
  mediaLink: (id: string) => string
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
        if (j?.ok && j.item) added.push({ id: j.item.id, url: mediaLink(j.item.id), name: file.name })
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
// страницы, по «Обновить» и когда человек сворачивает ящик с терминалом; полный отчёт — при раскрытии строки.
// 556-11 (владелец 2026-10-23: «кнопку проанализировать итог … выдаёшь мне рекомендацию … продолжить разбор или кнопка отправить в
// продуктовый Quiz»): у разбора без решения — «Проанализировать итог» (главный агент, навык analyze-study); с решением — оно и две кнопки,
// рекомендованная выделена, выбирает человек.
export type Verdict = { verdict: "continue" | "quiz"; summary: string; pages: { address: string; note: string }[]; at: string; signIn?: { site: string } }
/** 556-14: a screen of a study kept in the node storage (only its id; the file comes through the core). */
export type ReportScreen = { name: string; id: string }
export type ReportItem = { job: string; target: string; kind: string; summary: string; verdict: Verdict | null; series?: string; part?: number; screens?: ReportScreen[] }
/** 556-15: the parts of one series in one row; the first study names the series and holds its decision. */
type ReportGroup = { series: string; root: ReportItem; parts: ReportItem[] }

function groupsOf(items: ReportItem[]): ReportGroup[] {
  const by = new Map<string, ReportItem[]>()
  for (const it of items) { const s = it.series || it.job; by.set(s, [...(by.get(s) ?? []), it]) }
  return [...by].map(([series, list]) => {
    const parts = [...list].sort((a, b) => (a.part ?? 1) - (b.part ?? 1))
    return { series, root: parts.find((x) => x.job === series) ?? parts[0], parts }
  })
}

// 556-14 (владелец 2026-10-23: «скриншоты … в наш файловое хранилище чтобы … можно было подсматривать кнопки карточки»): экраны части —
// миниатюрами; нажатие открывает снимок целиком. Адрес строится из id, ссылке из отчёта страница не верит.
function Shots({ screens }: { screens: ReportScreen[] }) {
  if (!screens.length) return null
  return (
    <ul className="flex flex-wrap gap-2" data-rea-part-shots={screens.length}>
      {screens.map((s) => {
        const src = `${BASE}/api/media/${encodeURIComponent(s.id)}/file`
        return (
          <li key={s.id}>
            <a href={src} target="_blank" rel="noreferrer" title={s.name} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element -- снимок из хранилища узла, размеры неизвестны заранее */}
              <img src={src} alt={s.name} loading="lazy" className="h-24 w-36 rounded-md border border-border object-cover object-top" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
type ReportView = { markdown: string | null } | "loading" | "failed"
type ReportActions = { onAnalyze: (it: ReportItem) => void; onContinue: (it: ReportItem) => void; onQuiz: (it: ReportItem) => void }

// 556-13: the decision itself stays in its study row; what to DO with it is the wide button on top of «Finished studies».
function VerdictBlock({ it, w, onAnalyze }: { it: ReportItem; w: ReverseEngineeringWords["reports"]; onAnalyze: (it: ReportItem) => void }) {
  const v = it.verdict
  if (!v) {
    return (
      <div>
        <Button type="button" onClick={() => onAnalyze(it)} data-rea-analyze={it.job}>{w.analyze}</Button>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-3" data-rea-verdict={v.verdict}>
      <p className="font-medium">{w.verdictTitle} · {v.at.slice(0, 10)}</p>
      <p className="max-w-prose">{v.summary}</p>
      {v.pages.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground">{w.verdictPages}</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {v.pages.map((p) => <li key={`${p.address}|${p.note}`}>{[p.address, p.note].filter(Boolean).join(" — ")}</li>)}
          </ul>
        </div>
      )}
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={() => onAnalyze(it)} data-rea-analyze={it.job}>{w.analyzeAgain}</Button>
      </div>
    </div>
  )
}

// 556-13. Владелец 2026-10-23: «Если ты считаешь что на следующем этапе мне нужно войти в авторизацию … выйди оранжевую карточку и скажи
// для дальнейшего углубление в проект необходимо сделать следующее … обязательно напиши в каком браузере я имею в виду e-mail».
// Окно входа — отдельный Chrome узла на экране компьютера с узлом (дверь `/api/node/study`, шаги 556-6…556-8): человек ставит три отметки
// согласия, вписывает сайт и входит сам; пароль узел не видит. Состояние читается при открытии карточки и по «Проверить».
type StudyAccount = { site: string; consent: { at: string } | null; session: { at: string; valid: boolean } | null; window: { at: string; open: boolean } | null } | null

function SignInCard({ site, w, helpLabel, lang, onSignedIn }: {
  site: string
  w: ReverseEngineeringWords["reports"]["signIn"]
  helpLabel: string
  lang: string
  onSignedIn: (yes: boolean) => void
}) {
  const [acc, setAcc] = useState<StudyAccount | "loading" | "failed">("loading")
  const [busy, setBusy] = useState(false)

  async function read() {
    try {
      const r = await fetch(`${BASE}/api/node/study?site=${encodeURIComponent(site)}`, { cache: "no-store" })
      const j = (await r.json().catch(() => null)) as { ok?: boolean; account?: StudyAccount } | null
      if (!j?.ok) { setAcc("failed"); onSignedIn(false); return }
      setAcc(j.account ?? null)
      onSignedIn(Boolean(j.account?.session?.valid))
    } catch {
      setAcc("failed")
      onSignedIn(false)
    }
  }
  useEffect(() => {
    void read()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read once per card; the card is keyed by its site
  }, [])

  async function openWindow() {
    setBusy(true)
    try {
      await fetch(`${BASE}/api/node/study`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "open", site, lang }) })
    } catch { /* the state line below says what happened */ }
    await read()
    setBusy(false)
  }

  const a = acc === "loading" || acc === "failed" ? null : acc
  const done = Boolean(a?.session?.valid)
  const state = acc === "loading" ? w.states.loading
    : acc === "failed" ? w.states.failed
    : done ? w.states.done
    : a?.window?.open ? w.states.window
    : a?.consent ? w.states.consent
    : w.states.none
  return (
    <section
      className={`flex flex-col gap-3 rounded-lg border p-4 ${done ? "border-success/50 bg-success/10" : "border-warning/50 bg-warning/10"}`}
      data-rea-sign-in={done ? "done" : "needed"}
    >
      <div className="flex items-start gap-1">
        <p className="flex-1 pt-2 text-sm font-medium text-foreground">{fill(w.title, { site })}</p>
        <Help text={fill(w.help, { site })} label={helpLabel} />
      </div>
      {!done && (
        <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
          {w.steps.map((s) => <li key={s}>{fill(s, { site })}</li>)}
        </ol>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {!done && (
          <Button type="button" onClick={() => void openWindow()} disabled={busy || Boolean(a?.window?.open)} data-rea-sign-in-open>
            {busy ? w.opening : w.open}
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => void read()} data-rea-sign-in-check>{w.check}</Button>
        <p className="inline-flex items-center gap-1.5 text-sm text-foreground" role="status" data-rea-sign-in-state>
          {done && <Check className="size-4 text-success" aria-hidden />}
          {state}
        </p>
      </div>
    </section>
  )
}

// 556-13. Владелец 2026-10-23: «Ответ модели должен был создать реальную кнопку … на вкладке готовые разборы большая широкая кнопка на всю
// ширину контейнера с текстом продолжить разбор». Последнее решение агента — сверху «Готовых разборов»: «продолжить» — широкая
// «Продолжить разбор» (с входом — ждёт его), «в квиз» — широкая «Отправить в продуктовый квиз».
function DecisionPanel({ it, w, helpLabel, lang, onContinue, onQuiz }: {
  it: ReportItem
  w: ReverseEngineeringWords["reports"]
  helpLabel: string
  lang: string
  onContinue: (it: ReportItem) => void
  onQuiz: (it: ReportItem) => void
}) {
  const v = it.verdict as Verdict
  const site = v.verdict === "continue" ? v.signIn?.site ?? null : null
  const [signedIn, setSignedIn] = useState(!site)
  const target = it.target.trim().split(/\s+/)[0] || it.job
  return (
    <div className="flex flex-col gap-3" data-rea-decision={v.verdict} data-rea-decision-job={it.job}>
      <p className="text-sm text-muted-foreground">{fill(w.decisionOf, { target, date: v.at.slice(0, 10) })}</p>
      {site && <SignInCard key={site} site={site} w={w.signIn} helpLabel={helpLabel} lang={lang} onSignedIn={setSignedIn} />}
      {v.verdict === "continue" ? (
        <Button type="button" size="lg" className="h-12 w-full text-base" disabled={!signedIn} onClick={() => onContinue(it)} data-rea-continue-wide={it.job}>
          {w.continueStudy}
        </Button>
      ) : (
        <Button type="button" size="lg" className="h-12 w-full text-base" onClick={() => onQuiz(it)} data-rea-to-quiz-wide={it.job}>
          {w.toQuiz}
        </Button>
      )}
    </div>
  )
}

function Reports({ w, refresh, helpLabel, lang, onAnalyze, onContinue, onQuiz }: { w: ReverseEngineeringWords["reports"]; refresh: number; helpLabel: string; lang: string } & ReportActions) {
  const [items, setItems] = useState<ReportItem[] | "loading" | "failed">("loading")
  const [views, setViews] = useState<Record<string, ReportView>>({})
  const [reload, setReload] = useState(0)

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch(`${BASE}/api/node/reverse-report`, { cache: "no-store" })
        const j = (await r.json().catch(() => null)) as { ok?: boolean; items?: ReportItem[] } | null
        setItems(j?.ok ? (j.items ?? []).map((it) => ({ ...it, verdict: it.verdict ?? null })) : "failed")
      } catch {
        setItems("failed")
      }
    })()
  }, [refresh, reload])

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
  else {
    // 556-15: одна строка на серию — первый разбор называет серию и держит решение, части 2…N идут под ним со своими экранами.
    const groups = groupsOf(items)
    const markdownOf = (job: string) => {
      const v = views[job]
      return v === undefined || v === "loading" ? (
        <p className="inline-flex items-center gap-2 text-muted-foreground"><Spinner /> {w.open}</p>
      ) : v === "failed" ? (
        <p className="text-destructive" role="alert">{w.openFailed}</p>
      ) : (
        v.markdown && <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs leading-relaxed">{v.markdown}</pre>
      )
    }
    body = (
      <Accordion
        type="single"
        collapsible
        className="rounded-md border border-border px-3"
        onValueChange={(v) => { for (const p of groups.find((g) => g.series === v)?.parts ?? []) void open(p.job) }}
        data-rea-reports={groups.length}
      >
        {groups.map((g, i) => {
          const it = g.root
          const many = g.parts.length > 1
          const date = /^\d{4}-\d{2}-\d{2}/.test(it.job) ? it.job.slice(0, 10) : ""
          return (
            <AccordionItem key={g.series} value={g.series} className={i === groups.length - 1 ? "border-b-0" : undefined} data-rea-report={it.job} data-rea-series-parts={g.parts.length}>
              <AccordionTrigger>
                <span className="flex min-w-0 flex-wrap items-center gap-2 text-left">
                  <span className="break-all font-medium text-foreground">{it.target || it.job}</span>
                  <Badge variant="secondary">{w.kinds[it.kind] ?? w.kinds.other}</Badge>
                  {many && <Badge variant="secondary">{fill(w.parts, { n: String(g.parts[g.parts.length - 1].part ?? g.parts.length) })}</Badge>}
                  {it.verdict && <Badge variant="outline">{it.verdict.verdict === "continue" ? w.continueStudy : w.toQuiz}</Badge>}
                  {date && <span className="text-xs text-muted-foreground">{date}</span>}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-3 text-sm text-foreground">
                  <VerdictBlock it={it} w={w} onAnalyze={onAnalyze} />
                  {g.parts.map((p) => (
                    <div key={p.job} className="flex flex-col gap-2" data-rea-part={p.part ?? 1}>
                      {many && <p className="font-medium">{fill(w.partTitle, { n: String(p.part ?? 1) })}</p>}
                      {p.summary && <p className="max-w-prose">{p.summary}</p>}
                      <Shots screens={p.screens ?? []} />
                      {markdownOf(p.job)}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    )
  }

  // 556-13: the newest decision of all studies is the one the wide button acts on.
  const latest = Array.isArray(items)
    ? items.filter((it) => it.verdict).sort((a, b) => Date.parse((b.verdict as Verdict).at) - Date.parse((a.verdict as Verdict).at))[0] ?? null
    : null

  return (
    <section className="flex flex-col gap-3" data-rea-reports-section>
      <div className="flex items-center justify-between gap-2">
        <H2 variant="ui">{w.title}</H2>
        <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => setReload((n) => n + 1)} data-rea-reports-refresh>
          <RefreshCw className="size-4" aria-hidden />
          {w.refresh}
        </Button>
      </div>
      {latest && (
        <DecisionPanel
          key={`${latest.job}|${(latest.verdict as Verdict).at}`}
          it={latest}
          w={w}
          helpLabel={helpLabel}
          lang={lang}
          onContinue={onContinue}
          onQuiz={onQuiz}
        />
      )}
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
  const [drawer, setDrawer] = useState<{ n: number; text: string; service: string } | null>(null)
  const [refresh, setRefresh] = useState(0)
  // 556-13: пока на экране ящик, который открыл человек, страница слушает «решение записано» и перечитывает разборы — кнопка
  // появляется без «Обновить». Ящик свёрнут — соединения нет: решение покажут открытие страницы, «Обновить» и «Свернуть».
  const drawerOpen = drawer !== null
  useEffect(() => {
    if (!drawerOpen) return
    let events: EventSource | null = null
    try {
      events = new EventSource(`${BASE}/api/node/reverse-report/events`)
      events.addEventListener("verdict", () => setRefresh((n) => n + 1))
    } catch { /* no stream: the list still reloads on Collapse and Refresh */ }
    return () => events?.close()
  }, [drawerOpen])
  // Ссылка на скриншот для агента — через ядро на этом компьютере (`nodeUrl` двери `/api/domain/state`): хранилище напрямую отвечает
  // 401 без ключа узла (замерено 556-9), а ядро отдаёт файл. Нет ответа — адрес этой страницы.
  const [nodeUrl, setNodeUrl] = useState<string | null>(null)
  useEffect(() => {
    fetch(`${BASE}/api/domain/state`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { nodeUrl?: string | null } | null) => setNodeUrl(d?.nodeUrl ? d.nodeUrl.replace(/\/+$/, "") : null))
      .catch(() => setNodeUrl(null))
  }, [])
  const mediaLink = (id: string) => `${nodeUrl ?? window.location.origin}${BASE}/api/media/${encodeURIComponent(id)}/file`

  function addPage() {
    const key = nextKey.current++
    setPages((p) => [...p, { key, address: "", note: "", shots: [] }])
    setOpen((o) => [...o, `page-${key}`])
  }

  function start() {
    const value = target.trim()
    if (!value) return
    setDrawer((d) => ({ n: (d?.n ?? 0) + 1, service: "build", text: composeTask(words, item, value, pages) }))
  }

  // 556-11: адрес разбора — первое слово цели отчёта («https://www.tinylaunch.com (the apex … )»).
  const firstUrl = (t: string) => t.trim().split(/\s+/)[0] ?? ""
  function analyze(it: ReportItem) {
    setDrawer((d) => ({ n: (d?.n ?? 0) + 1, service: "build", text: fill(words.reports.taskAnalyze, { job: it.job, target: firstUrl(it.target), item }) }))
  }
  function toQuiz(it: ReportItem) {
    setDrawer((d) => ({ n: (d?.n ?? 0) + 1, service: item, text: fill(words.reports.taskQuiz, { job: it.job, target: firstUrl(it.target) }) }))
  }
  // 556-13: широкая «Продолжить разбор» — задача главному агенту в ящике справа (с входом — в тестовой учётной записи сайта); чего не
  // хватает, агент берёт из решения (`npm run report`). ✗ 556-11 кнопка лишь заполняла карточки — владелец: «как ты собираешься
  // продолжать разбор если ты не собираешься заходить в страницы защищенные авторизацией».
  function continueStudy(it: ReportItem) {
    const v = it.verdict
    if (!v) return
    let text = fill(words.reports.taskContinue, { job: it.job, target: firstUrl(it.target), item })
    if (v.signIn?.site) text += fill(words.reports.taskContinueAccount, { site: v.signIn.site })
    setDrawer((d) => ({ n: (d?.n ?? 0) + 1, service: "build", text }))
  }

  return (
    <div className="my-4 flex flex-col gap-4 lg:flex-row lg:items-start" data-reverse-engineering>
      <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-8">
        <ToolNotice t={words.tool} />
        <div className="flex flex-col gap-4" data-rea-form>
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
                mediaLink={mediaLink}
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
        <Reports w={words.reports} refresh={refresh} helpLabel={words.helpLabel} lang={lang} onAnalyze={analyze} onContinue={continueStudy} onQuiz={toQuiz} />
      </div>
      {drawer && (
        <TerminalDrawer
          key={drawer.n}
          service={drawer.service}
          lang={lang}
          words={drawer.service === "build" ? words.drawer : words.drawerElement}
          kit={kit}
          text={drawer.text}
          start
          onCollapse={() => { setDrawer(null); setRefresh((n) => n + 1) }}
        />
      )}
    </div>
  )
}
