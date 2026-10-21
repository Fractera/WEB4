"use client"

import { useEffect, useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { buttonVariants } from "@/components/ui/button"
import { Card as UiCard, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { LagrixRating, type LagrixRatingWords } from "@/components/element-docs/lagrix-rating"
import { NodeWalletBody } from "@/components/wallet/node-wallet.client"
import type { NodeWalletWords } from "@/components/wallet/node-wallet.i18n"
import { IndicatorHint } from "@/components/element-docs/indicator-hint.client"

// «ПАСПОРТ» УЗЛА (478-1, переделан по слову владельца 2026-10-14): «посмотри вкладку роман, дизайн в блоке а2а … именно такая
// карточка у нас должна была лежать в паспорте и описывать аккумулирующий рейтинг по всем элементам а под ним должны были быть все
// элементы … то же самый дизайн который будет иметь полное заголовок, первую строчку описание и возможность раскрыть полное описание
// а также интерфейс … если нет описания чтобы его заказать».
//
// Сверху — карточка рейтинга Lagrix (`LagrixRating`, та же, что на главной A2A элемента) для всего узла; под ней та же карточка на
// каждый элемент (root и кастомные). Описание раскрывается аккордеоном — открыто одно на всю страницу. Нет описания — красная точка
// у заголовка и красная кнопка, открывающая терминал элемента с задачей «опиши себя». Карточки спрашиваются у `/api/node/passport`
// один раз при открытии (опроса нет).
//
// 495-5 (владелец 2026-10-15): «Все указанные блоки карточек это аккордеон, по умолчанию раскрыта карточка узла все остальные
// свёрнутого аккордеон открываются одна закрывается все остальные включая первую». Один аккордеон `single` на узел, кошелёк и каждый
// элемент; «Полное описание» и «до/после» кошелька — своими аккордеонами внутри карточки, чтобы не сворачивать её саму.

type Card = {
  id: string
  custom: boolean
  name: string
  lead: string | null
  summary: string | null
  provides: string[]
  described: boolean
  open: string
  generate: string | null
  reputation: null
}

export type NodePassportWords = {
  rating: LagrixRatingWords
  /** Hints of the node's card: «… этого узла, включая все его элементы» (495-5). */
  nodeHints: LagrixRatingWords["hints"]
  nodeTitle: string
  nodeLead: string
  nodeNote: string
  elementNote: string
  root: string
  custom: string
  loading: string
  unavailable: string
  empty: string
  noDescription: string
  generate: string
  notBorn: string
  fullDescription: string
  provides: string
  openElement: string
  wallet: NodeWalletWords
  /** 553-9: режим узла и объяснение обоих режимов под ⓘ. */
  mode: { label: string; project: string; factory: string; hint: string; lines: string[] }
}

// 553-9 (владелец 2026-10-21: «на вкладке паспорт имела бы смысл рассказать о том в каком режиме работает узел и под знаком вопрос более
// подробно узнать какие бы существуют режимы чем они отличаются»). Режим — о машине, поэтому спрашивается в браузере (закон 264):
// смена `npm run node-type -- set` видна при следующем открытии без пересборки.
function NodeMode({ words }: { words: NodePassportWords["mode"] }) {
  const [type, setType] = useState<"project" | "factory" | null>(null)
  useEffect(() => {
    fetch(`${BASE}/api/node/type`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { type?: string } | null) => setType(d?.type === "factory" ? "factory" : d?.type === "project" ? "project" : null))
      .catch(() => setType(null))
  }, [])
  if (!type) return null
  return (
    <p className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground" data-node-mode={type}>
      {words.label}: <span className="font-medium text-foreground">{type === "factory" ? words.factory : words.project}</span>
      <IndicatorHint label={`${words.label}: ${words.hint}`} text={words.lines} />
    </p>
  )
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export function NodePassport({ words, lang }: { words: NodePassportWords; lang: string }) {
  const [cards, setCards] = useState<Card[] | "loading" | "failed">("loading")
  const [wallet, setWallet] = useState<{ address: string } | null>(null)

  useEffect(() => {
    fetch(`${BASE}/api/node/passport?lang=${lang}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { cards: Card[]; wallet: { address: string } | null }) => { setCards(d.cards); setWallet(d.wallet) })
      .catch(() => setCards("failed"))
  }, [lang])

  const node = (
    <LagrixRating id="node" item="node" words={{ ...words.rating, hints: words.nodeHints, note: words.nodeNote }} title={words.nodeTitle} lead={words.nodeLead} />
  )

  const walletCard = (
    <AccordionItem value="wallet" className="border-b-0">
    <UiCard className="my-4">
      <CardHeader className="relative">
        <CardTitle className="text-xl font-semibold">{words.wallet.title}</CardTitle>
        <CardDescription>{words.wallet.lead}</CardDescription>
        <CardAction>
          <AccordionTrigger aria-label={words.rating.toggle} className="py-0 after:absolute after:inset-0 after:content-['']" />
        </CardAction>
      </CardHeader>
      <AccordionContent className="pb-0">
      <CardContent className="flex flex-col gap-4">
        {/* 530-1: тело кошелька — общий островок четырёх мест; состояние уже пришло с паспортом. */}
        <NodeWalletBody words={words.wallet} initial={wallet} />
      </CardContent>
      </AccordionContent>
    </UiCard>
    </AccordionItem>
  )

  if (cards === "loading" || cards === "failed" || cards.length === 0) {
    return (
      <>
        <NodeMode words={words.mode} />
        <Accordion type="single" collapsible defaultValue="node">{node}</Accordion>
        {cards === "loading" ? (
          <p className="my-6 inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> {words.loading}</p>
        ) : cards === "failed" ? (
          <p className="my-6 text-sm text-destructive" role="alert">{words.unavailable}</p>
        ) : (
          <p className="my-6 text-sm text-muted-foreground">{words.empty}</p>
        )}
      </>
    )
  }

  return (
    <>
      <NodeMode words={words.mode} />
      <Accordion type="single" collapsible defaultValue="node">
        {node}
        {walletCard}
        {cards.map((c) => {
          const dot = c.described ? null : (
            <span className="size-2.5 shrink-0 rounded-full bg-destructive" role="img" aria-label={words.noDescription} data-no-description />
          )
          const kind = { ...words.rating, eyebrow: c.id === "root" ? words.root : words.custom, note: words.elementNote }
          return (
            <div key={c.id} data-passport={c.id} data-described={c.described ? "yes" : "no"}>
              <LagrixRating
                id={c.id}
                item={`el:${c.id}`}
                words={kind}
                marker={dot}
                title={<a href={`${BASE}/${lang}${c.open}`} className="relative z-10 underline-offset-4 hover:underline" title={words.openElement}>{c.name}</a>}
                lead={<span className="line-clamp-1">{c.lead ?? words.noDescription}</span>}
              >
                {c.described && c.summary ? (
                  <Accordion type="single" collapsible>
                  <AccordionItem value={c.id} className="border-b-0">
                    <AccordionTrigger className="py-1 text-primary">{words.fullDescription}</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-3 pb-1">
                      <p className="leading-relaxed text-foreground">{c.summary}</p>
                      {c.provides.length > 0 && (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{words.provides}</p>
                          <ul className="list-disc space-y-0.5 pl-5 text-foreground">
                            {c.provides.map((p) => <li key={p}>{p}</li>)}
                          </ul>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                  </Accordion>
                ) : c.generate ? (
                  <div>
                    <a href={`${BASE}${c.generate}`} className={buttonVariants({ variant: "destructive", size: "sm" })}>{words.generate}</a>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{words.notBorn}</p>
                )}
              </LagrixRating>
            </div>
          )
        })}
      </Accordion>
    </>
  )
}
