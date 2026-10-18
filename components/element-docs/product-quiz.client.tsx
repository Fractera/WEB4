"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { H2, H3, P, Small } from "@/components/ui/typography"
import type { ProductQuiz, QuizItem } from "@/lib/web4-items/product-quiz"

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
}

type Read = { quiz: ProductQuiz | null; problems: string[] }

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (all, key: string) => (key in values ? String(values[key]) : all))

const anchor = (id: string) => `quiz-${id}`

export function ProductQuizIsland({ item, lang, terminalHref, words }: { item: string; lang: string; terminalHref: string; words: ProductQuizWords }) {
  const [read, setRead] = useState<Read | null>(null)
  const [failed, setFailed] = useState(false)
  const [bot, setBot] = useState<string | null>(null)

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
    <Link href={terminalHref} className={buttonVariants({})} data-quiz-terminal>
      {words.terminal}
    </Link>
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
        <CardContent className="flex flex-wrap gap-2">
          <Link href={terminalHref} className={buttonVariants({})} data-quiz-start>
            {words.start}
          </Link>
          {telegram}
        </CardContent>
      </Card>
    )
  }

  const items = quiz.modules.flatMap((m) => m.items)
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
          <Small className="text-muted-foreground" data-quiz-counters>
            {fill(words.counters, { confirmed: confirmedCount, total: items.length, questions: quiz.openQuestions.length })}
            {" · "}
            {fill(words.language, { lang: quiz.language })}
          </Small>
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
                  <span className="font-mono text-[length:var(--fs-small)] text-muted-foreground">{it.id}</span>
                  <H3 variant="ui">{it.title}</H3>
                  <Badge variant="outline">{words.kinds[it.kind]}</Badge>
                  {statusBadge(it.status, it.confirmed?.date)}
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
                <Small><span className="font-mono text-muted-foreground">{o.id}</span> {o.text}</Small>
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
    </div>
  )
}
