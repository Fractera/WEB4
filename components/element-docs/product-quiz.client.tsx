"use client"

import { useEffect, useRef, useState, type PointerEvent } from "react"
import { MessageSquareText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { BlockTask } from "@/_tools/block-task/client/block-task.client"
import type { BlockTaskUi } from "@/_tools/block-task/types/block-task"
import type { AppDialogUi } from "@/components/dialog/app-dialog.i18n"
import { isLoopbackHostname } from "@/lib/auth/owner-at-machine"
import { cleanPaste } from "@/app/[lang]/(architectLayer)/architect/kits/_agent-kit/core/client/terminal-paste.mjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { H2, H3, P, Small } from "@/components/ui/typography"
import type { ProductQuiz, QuizItem, QuizStepState, QuizWork } from "@/lib/web4-items/product-quiz"

// ISLAND OF THE PRODUCT QUIZ (node step 536-1). The person, 2026-10-18: «А вверху инструкция если хотите что-то добавить перейдите
// (ссылка на терминал) (ссылка на Telegram если он есть) и скажите что вы хотите продолжить развитие продуктового квизы».
// The page is prerendered and the agent edits the quiz at any minute, so the quiz is asked from `GET /api/node/product-quiz` when the
// page opens. The page only reads: the quiz changes in a conversation with the element's agent, never by a button here.
// Four states: loading · the quiz · no quiz yet (an invitation to plan) · refused (a refusal means «unknown», not «no quiz»).
// 🔒 The Telegram link appears only when the element's bot is connected (the channel door of the element answers with the bot
// and at least one allowed person); on the temporary address that door refuses, and the link is simply not drawn.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export type ProductQuizWords = {
  loading: string
  failed: string
  instructionTitle: string
  instructionText: string
  terminal: string
  telegram: string
  /** «{confirmed}», «{total}», «{questions}» are replaced. */
  counters: string
  /** «{lang}» is replaced. */
  language: string
  vision: string
  actors: string
  openQuestions: string
  notNow: string
  slices: string
  /** 563-5: the stages 0…N of the quiz. */
  stages: string
  stageWorks: string
  stageReady: string
  /** 556-4: the references of a product like an existing one (skill `product-clone`). «{covered}», «{areas}», «{assigned}», «{total}»,
   *  «{later}» and «{count}» are replaced. */
  references: string
  referencesLead: string
  coverage: string
  stageParity: string
  seenIn: string
  stageShort: string
  unknowns: string
  referenceRules: Record<string, string>
  referenceSources: Record<string, string>
  decisions: string
  draft: string
  /** «{date}» is replaced. */
  confirmed: string
  kinds: Record<QuizItem["kind"], string>
  acceptance: string
  dependsOn: string
  /** «{where}» is replaced. */
  builtBefore: string
  problems: string
  emptyTitle: string
  emptyText: string
  start: string
  /** 536-2: the legend under the instruction and the words of the dot. */
  legend: Record<QuizWork, string>
  /** What the dot says in words (its label and the head of the hover). «{step}» is replaced by the step numbers. */
  work: Record<QuizWork, string>
  stepState: Record<QuizStepState, string>
  stepsTitle: string
  noSteps: string
  /** «{commit}» is replaced. */
  commit: string
  /** 536-3: the 💬 of an item and the task line it puts in the window. «{id}», «{title}», «{text}» are replaced. */
  ask: string
  askItem: string
  askVision: string
  askQuestion: string
  askContinue: string
  askStart: string
  /** Opened not from this computer (the terminal works only here): the window copies the phrase for the element's bot. */
  remoteNote: string
  telegramPhrase: string
  sendRemote: string
  copied: string
  copyFailed: string
}

/** 536-3: the window of a quiz task — the block-task tool in its note mode, with the quiz's own words; the server picks them. */
export type QuizTaskKit = { ui: BlockTaskUi; dialogUi: AppDialogUi; keyHref: string }

// 🔒 Colours are the core theme's tokens, light and dark: done — success, in progress — warning, planned — tone-reach, none — an empty
// ring. The colour is never the only carrier: the dot has its words as the label and in the hover.
const DOT: Record<QuizWork, string> = {
  done: "bg-success",
  "in-progress": "bg-warning",
  planned: "bg-tone-reach",
  none: "border border-muted-foreground bg-transparent",
}

function Dot({ work }: { work: QuizWork }) {
  return <span className={`inline-block size-2.5 shrink-0 rounded-full ${DOT[work]}`} aria-hidden />
}

// 🔒 HOVER FOR A MOUSE, A PRESS FOR A FINGER (536-2, measured): with plain mouse handlers the hover opened the window and the click
// that followed toggled it shut — and a phone sends a compatibility hover before every tap, so a tap closed it at once. Hover reacts
// only to `pointerType === "mouse"`; a mouse click keeps it open; a tap and the keyboard (click with `detail === 0`) toggle it. Closing
// on leave waits a moment, so the pointer can cross the gap from the dot to the window.
function ItemWork({ it, words }: { it: QuizItem; words: ProductQuizWords }) {
  const [open, setOpen] = useState(false)
  const pointer = useRef("mouse")
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stay = () => {
    if (closing.current) clearTimeout(closing.current)
    closing.current = null
  }
  const hoverIn = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return
    stay()
    setOpen(true)
  }
  const hoverOut = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return
    stay()
    closing.current = setTimeout(() => setOpen(false), 150)
  }
  useEffect(() => stay, [])
  const numbers = it.steps.filter((s) => s.state === it.work).map((s) => s.number).join(", ")
  const label = fill(words.work[it.work], { step: numbers })
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={label}
        onPointerDown={(e) => { pointer.current = e.pointerType }}
        onPointerEnter={hoverIn}
        onPointerLeave={hoverOut}
        onClick={(e) => {
          e.preventDefault()
          const byMouse = e.detail > 0 && pointer.current === "mouse"
          setOpen((o) => (byMouse ? true : !o))
        }}
        data-quiz-dot={it.work}
      >
        <Dot work={it.work} />
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-80 flex-col gap-2" onPointerEnter={hoverIn} onPointerLeave={hoverOut} data-quiz-steps={it.id}>
        <Small className="font-medium">{label}</Small>
        {it.steps.length > 0 ? (
          <>
            <Small className="text-muted-foreground">{words.stepsTitle}</Small>
            <ul className="flex flex-col gap-1">
              {it.steps.map((s) => (
                <li key={`${s.number}-${s.state}`} className="flex items-start gap-2" data-quiz-step={s.number}>
                  <span className="pt-1"><Dot work={s.state} /></span>
                  <Small>
                    <span className="font-mono">{s.number}</span> · {s.title} · {words.stepState[s.state]}
                    {s.commit ? ` · ${fill(words.commit, { commit: s.commit })}` : ""}
                  </Small>
                </li>
              ))}
            </ul>
          </>
        ) : !it.builtBefore && <Small className="text-muted-foreground">{words.noSteps}</Small>}
        {it.builtBefore && <Small className="text-muted-foreground">{fill(words.builtBefore, { where: it.builtBefore })}</Small>}
      </PopoverContent>
    </Popover>
  )
}

type Read = { quiz: ProductQuiz | null; problems: string[] }

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (all, key: string) => (key in values ? String(values[key]) : all))

const anchor = (id: string) => `quiz-${id}`

// 536-3 (the person, 2026-10-18): «напротив каждого абзаца иконка и инструкция например если хотите обратить внимание на этот часть
// инструкции нажмите на иконку! Агент из искусственного интеллекта уточнит что вы имели в виду». The 💬 opens the block-task window in
// its note mode: the task line names the item, the person adds words or voice. On this computer «Send» opens the element's terminal
// with the task in the paste window (it goes into the terminal only by the person's own button, law 316) — the same road as «Reject»
// of a preview (356-3). Opened from the internet, the terminal is not reachable: the window copies the phrase for the element's bot.
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // No secure context (plain http on an address): the old way still works where the new one is missing.
    const area = document.createElement("textarea")
    area.value = text
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand("copy")
    area.remove()
    return ok
  }
}

export function ProductQuizIsland({ item, lang, terminalHref, words, task }: { item: string; lang: string; terminalHref: string; words: ProductQuizWords; task: QuizTaskKit }) {
  const [read, setRead] = useState<Read | null>(null)
  const [failed, setFailed] = useState(false)
  const [bot, setBot] = useState<string | null>(null)
  const [local, setLocal] = useState(true)
  const [askLine, setAskLine] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => setLocal(isLoopbackHostname(window.location.hostname)), [])

  async function send(text: string) {
    setAskLine(null)
    if (local) {
      window.location.href = `${BASE}${terminalHref}?paste=${encodeURIComponent(cleanPaste(text))}`
      return
    }
    setNotice((await copyText(text)) ? words.copied : words.copyFailed)
  }
  const askButton = (line: string, id: string) => (
    <Button type="button" variant="ghost" size="icon-xs" aria-label={words.ask} title={words.ask} onClick={() => { setNotice(null); setAskLine(line) }} data-quiz-ask={id}>
      <MessageSquareText aria-hidden />
    </Button>
  )
  const dialog = (
    <BlockTask
      note
      open={askLine !== null}
      onOpenChange={(o) => { if (!o) setAskLine(null) }}
      address={askLine ?? ""}
      lang={lang}
      ui={local ? task.ui : { ...task.ui, send: words.sendRemote }}
      dialogUi={task.dialogUi}
      voiceApiUrl={`${BASE}/api/transcribe?item=${encodeURIComponent(item)}`}
      keyHref={task.keyHref}
      onSend={(text) => void send(text)}
    />
  )

  useEffect(() => {
    let live = true
    fetch(`${BASE}/api/node/product-quiz?item=${encodeURIComponent(item)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { ok?: boolean; quiz?: ProductQuiz | null; problems?: string[] }) => {
        if (!live) return
        if (b.ok) setRead({ quiz: b.quiz ?? null, problems: Array.isArray(b.problems) ? b.problems : [] })
        else setFailed(true)
      })
      .catch(() => live && setFailed(true))
    fetch(`${BASE}/${lang}/architect/${encodeURIComponent(item)}/agent-api/channel`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((b: { ok?: boolean; botUsername?: string | null; allowed?: number } | null) => {
        if (live && b?.ok && b.botUsername && (b.allowed ?? 0) > 0) setBot(b.botUsername)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [item, lang])

  const terminal = (
    <Button type="button" onClick={() => { setNotice(null); setAskLine(words.askContinue) }} data-quiz-terminal>
      {local ? words.terminal : words.telegramPhrase}
    </Button>
  )
  const telegram = bot ? (
    <a href={`https://t.me/${bot}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })} data-quiz-telegram>
      {words.telegram}
    </a>
  ) : null

  if (failed) return <P className="text-muted-foreground" data-product-quiz="failed">{words.failed}</P>
  if (!read) return <P className="text-muted-foreground" data-product-quiz="loading">{words.loading}</P>

  const quiz = read.quiz
  if (!quiz) {
    return (
      <Card className="max-w-3xl" data-product-quiz="empty">
        <CardHeader>
          <CardTitle>{words.emptyTitle}</CardTitle>
          <CardDescription>{words.emptyText}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => { setNotice(null); setAskLine(words.askStart) }} data-quiz-start>
              {local ? words.start : words.telegramPhrase}
            </Button>
            {telegram}
          </div>
          {!local && <Small className="text-muted-foreground" data-quiz-remote>{words.remoteNote}</Small>}
          {notice && <Small role="status" data-quiz-notice>{notice}</Small>}
        </CardContent>
        {dialog}
      </Card>
    )
  }

  const items = quiz.modules.flatMap((m) => m.items)
  // 556-4: older readers of the door may not send the field — treat it as «no references».
  const refs = quiz.references ?? null
  const confirmedCount = items.filter((i) => i.status === "confirmed").length
  const statusBadge = (s: QuizItem["status"], date?: string) =>
    s === "confirmed"
      ? <Badge variant="secondary">{fill(words.confirmed, { date: date ?? "" })}</Badge>
      : <Badge variant="outline" data-quiz-draft>{words.draft}</Badge>

  return (
    <div className="flex max-w-4xl flex-col gap-8" data-product-quiz="quiz">
      <Card data-quiz-instruction>
        <CardHeader>
          <CardTitle>{words.instructionTitle}</CardTitle>
          <CardDescription>{words.instructionText}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">{terminal}{telegram}</div>
          {!local && <Small className="text-muted-foreground" data-quiz-remote>{words.remoteNote}</Small>}
          {notice && <Small role="status" data-quiz-notice>{notice}</Small>}
          <Small className="text-muted-foreground" data-quiz-counters>
            {fill(words.counters, { confirmed: confirmedCount, total: items.length, questions: quiz.openQuestions.length })}
            {" · "}
            {fill(words.language, { lang: quiz.language })}
          </Small>
          <ul className="flex flex-wrap gap-x-4 gap-y-1" data-quiz-legend>
            {(["done", "in-progress", "planned", "none"] as const).map((w) => (
              <li key={w} className="flex items-center gap-1.5"><Dot work={w} /><Small className="text-muted-foreground">{words.legend[w]}</Small></li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {read.problems.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-destructive p-3" role="alert" data-quiz-problems>
          <Small className="font-medium text-destructive">{words.problems}</Small>
          <ul className="flex flex-col gap-0.5">
            {read.problems.map((p) => <li key={p}><Small className="font-mono">{p}</Small></li>)}
          </ul>
        </div>
      )}

      <section className="flex flex-col gap-3" data-quiz-vision>
        <div className="flex items-center gap-2">
          <H2 variant="ui">{words.vision}</H2>
          {statusBadge(quiz.vision.status)}
          {askButton(words.askVision, "vision")}
        </div>
        <P>{quiz.vision.text}</P>
      </section>

      {quiz.actors.length > 0 && (
        <section className="flex flex-col gap-3" data-quiz-actors>
          <H2 variant="ui">{words.actors}</H2>
          <ul className="flex flex-col gap-2">
            {quiz.actors.map((a) => (
              <li key={a.id} id={anchor(a.id)} className="flex flex-col gap-0.5">
                <Small className="font-medium"><span className="font-mono text-muted-foreground">{a.id}</span> {a.name}</Small>
                <Small className="text-muted-foreground">{a.text}</Small>
              </li>
            ))}
          </ul>
        </section>
      )}

      {quiz.modules.map((m) => (
        <section key={m.slug} className="flex flex-col gap-3" data-quiz-module={m.slug}>
          <H2 variant="ui">{m.title}</H2>
          {m.text && <Small className="text-muted-foreground">{m.text}</Small>}
          <ul className="flex flex-col">
            {m.items.map((it) => (
              <li key={it.id} id={anchor(it.id)} className="flex flex-col gap-1.5 border-b border-border py-3 last:border-b-0" data-quiz-item={it.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <ItemWork it={it} words={words} />
                  <span className="font-mono text-[length:var(--fs-small)] text-muted-foreground">{it.id}</span>
                  <H3 variant="ui">{it.title}</H3>
                  <Badge variant="outline">{words.kinds[it.kind]}</Badge>
                  {statusBadge(it.status, it.confirmed?.date)}
                  {askButton(fill(words.askItem, { id: it.id, title: it.title }), it.id)}
                </div>
                {it.text && <P className="my-0">{it.text}</P>}
                {it.acceptance && <Small className="text-muted-foreground">{words.acceptance}: {it.acceptance}</Small>}
                {it.dependsOn.length > 0 && (
                  <Small className="text-muted-foreground">
                    {words.dependsOn}:{" "}
                    {it.dependsOn.map((d, i) => (
                      <span key={d}>{i > 0 && ", "}<a href={`#${anchor(d)}`} className="underline underline-offset-4">{d}</a></span>
                    ))}
                  </Small>
                )}
                {it.builtBefore && <Small className="text-muted-foreground" data-quiz-built-before>{fill(words.builtBefore, { where: it.builtBefore })}</Small>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {quiz.openQuestions.length > 0 && (
        <section className="flex flex-col gap-3" data-quiz-questions>
          <H2 variant="ui">{words.openQuestions}</H2>
          <ul className="flex flex-col gap-2">
            {quiz.openQuestions.map((o) => (
              <li key={o.id} id={anchor(o.id)} className="flex flex-col gap-0.5">
                <div className="flex items-start gap-1">
                  <Small><span className="font-mono text-muted-foreground">{o.id}</span> {o.text}</Small>
                  {askButton(fill(words.askQuestion, { id: o.id, text: o.text }), o.id)}
                </div>
                {o.about.length > 0 && (
                  <Small className="text-muted-foreground">
                    {o.about.map((d, i) => <span key={d}>{i > 0 && ", "}<a href={`#${anchor(d)}`} className="underline underline-offset-4">{d}</a></span>)}
                  </Small>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {refs && (
        <section className="flex flex-col gap-3" data-quiz-references>
          <H2 variant="ui">{words.references}</H2>
          <Small className="text-muted-foreground">{words.referencesLead}</Small>
          <Small data-quiz-parity>
            {fill(words.coverage, {
              covered: refs.areas.filter((a) => refs.scenarios.some((o) => o.area === a.id)).length,
              areas: refs.areas.length,
              assigned: refs.scenarios.filter((o) => o.stage !== null).length,
              total: refs.scenarios.length,
              later: refs.scenarios.filter((o) => o.notNow).length,
            })}
          </Small>
          <ul className="flex flex-col gap-1">
            {refs.products.map((p) => (
              <li key={p.id} data-quiz-reference={p.id}>
                <Small>
                  <span className="font-mono text-muted-foreground">{p.id}</span> {p.name} · {words.referenceRules[p.rules] ?? p.rules} ·{" "}
                  {words.referenceSources[p.source] ?? p.source}
                </Small>
              </li>
            ))}
          </ul>
          {refs.areas.map((a) => (
            <div key={a.id} className="flex flex-col gap-1">
              <P className="font-medium">{a.name}</P>
              <ul className="flex flex-col gap-1">
                {refs.scenarios.filter((o) => o.area === a.id).map((o) => (
                  <li key={o.id}>
                    <Small>
                      <span className="font-mono text-muted-foreground">{o.id}</span> {o.name} — {words.seenIn} {o.seenIn.join(", ")} ·{" "}
                      {o.stage !== null ? `${words.stageShort} ${o.stage}` : o.notNow ? words.notNow : "—"}
                    </Small>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {refs.unknowns.length > 0 && (
            <div className="flex flex-col gap-1">
              <P className="font-medium">{words.unknowns}</P>
              <ul className="flex flex-col gap-1">
                {refs.unknowns.map((u) => (
                  <li key={u.id}>
                    <Small><span className="font-mono text-muted-foreground">{u.id}</span> {u.text} → {u.question || u.decision}</Small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {quiz.stages.length > 0 && (
        <section className="flex flex-col gap-3" data-quiz-stages>
          <H2 variant="ui">{words.stages}</H2>
          <ol className="flex flex-col gap-3">
            {quiz.stages.map((s) => (
              <li key={s.n} className="flex flex-col gap-1" data-quiz-stage={s.n}>
                <div className="flex flex-wrap items-center gap-2">
                  <Small className="font-mono text-muted-foreground">{s.n}</Small>
                  <P className="font-medium">{s.name}</P>
                  {statusBadge(s.status, s.confirmed?.date)}
                </div>
                <Small>{words.stageWorks}: {s.works}</Small>
                <Small>{words.stageReady}: {s.ready}</Small>
                {s.items.length > 0 && <Small className="text-muted-foreground">{s.items.join(", ")}</Small>}
                {refs && refs.scenarios.length > 0 && (
                  <Small className="text-muted-foreground" data-quiz-stage-parity={s.n}>
                    {fill(words.stageParity, { count: refs.scenarios.filter((o) => o.stage === s.n).length, total: refs.scenarios.length })}
                  </Small>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {quiz.slices.length > 0 && (
        <section className="flex flex-col gap-3" data-quiz-slices>
          <H2 variant="ui">{words.slices}</H2>
          <ul className="flex flex-col gap-1">
            {quiz.slices.map((s) => <li key={s.id}><Small><span className="font-mono text-muted-foreground">{s.id}</span> {s.name}: {s.items.join(", ")}</Small></li>)}
          </ul>
        </section>
      )}

      {quiz.notNow.length > 0 && (
        <section className="flex flex-col gap-3" data-quiz-not-now>
          <H2 variant="ui">{words.notNow}</H2>
          <ul className="flex flex-col gap-1">
            {quiz.notNow.map((n) => <li key={n.id}><Small><span className="font-mono text-muted-foreground">{n.id}</span> {n.text}</Small></li>)}
          </ul>
        </section>
      )}

      {quiz.decisions.length > 0 && (
        <section className="flex flex-col gap-3" data-quiz-decisions>
          <H2 variant="ui">{words.decisions}</H2>
          <ul className="flex flex-col gap-2">
            {quiz.decisions.map((d) => (
              <li key={`${d.date}-${d.said}`} className="flex flex-col gap-0.5">
                <Small className="text-muted-foreground">{d.date}</Small>
                <Small>{d.said}</Small>
                {d.gist && <Small className="text-muted-foreground">{d.gist}</Small>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {dialog}
    </div>
  )
}
