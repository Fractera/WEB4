"use client"

import { useEffect, useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { buttonVariants } from "@/components/ui/button"
import { Card as UiCard, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { LagrixRating, type LagrixRatingWords } from "@/components/element-docs/lagrix-rating"
import { NodeWalletBody } from "@/components/wallet/node-wallet.client"
import type { NodeWalletWords } from "@/components/wallet/node-wallet.i18n"

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
  off?: string | null
  web4?: boolean
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
  /** 567: «Выключен:» перед причиной. */
  off: string
  /** 567-5: метки состояния у каждой карточки. */
  powerOn: string
  powerOff: string
  /** 566: подсказки звёздочки Web4 (слова владельца). */
  web4On: string
  web4Off: string
  wallet: NodeWalletWords
  /** 553-9 → 564: карточка режима узла — название, описание текущего режима, общее для обоих, где сменить. */
  mode: { label: string; project: string; factory: string; byDefault: string; projectText: string; factoryText: string; both: string; chosen: string; change: string }
}

// 553-9 (владелец 2026-10-21: «на вкладке паспорт имела бы смысл рассказать о том в каком режиме работает узел и под знаком вопрос более
// подробно узнать какие бы существуют режимы чем они отличаются»). Режим — о машине, поэтому спрашивается в браузере (закон 264):
// смена `npm run node-type -- set` видна при следующем открытии без пересборки.
function NodeMode({ words, lang }: { words: NodePassportWords["mode"]; lang: string }) {
  const [state, setState] = useState<{ type: "project" | "factory"; settingsUrl: string | null } | null>(null)
  useEffect(() => {
    fetch(`${BASE}/api/node/type`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { type?: string; settingsUrl?: string | null } | null) =>
        setState(d?.type === "factory" || d?.type === "project" ? { type: d.type, settingsUrl: d.settingsUrl ?? null } : null))
      .catch(() => setState(null))
  }, [])
  if (!state) return null
  const { type } = state
  // 564 (владелец 2026-10-21: «в паспорте должны дарить карточку в каком состоянии проекта по умолчанию … в паспорте … переключатели иметь
  // не будет будет просто показывать в каком режиме это работает»): карточка без переключателя; сменить — на странице настроек config.
  return (
    <UiCard className="mb-6" data-node-mode={type}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {words.label}: {type === "factory" ? words.factory : words.project}{type === "project" ? ` ${words.byDefault}` : ""}
        </CardTitle>
        <CardDescription>{type === "factory" ? words.factoryText : words.projectText}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">{words.both}</p>
        <p className="text-muted-foreground">{words.chosen}</p>
        {state.settingsUrl && (
          <a href={state.settingsUrl.replace("{lang}", lang)} className="self-start font-medium text-primary hover:underline" data-node-mode-settings>
            {words.change}
          </a>
        )}
      </CardContent>
    </UiCard>
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
        <NodeMode words={words.mode} lang={lang} />
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
      <NodeMode words={words.mode} lang={lang} />
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
                title={<span className="flex flex-wrap items-center gap-2">
                  <a href={`${BASE}/${lang}${c.open}`} className="relative z-10 underline-offset-4 hover:underline" title={words.openElement}>{c.name}</a>
                  {/* 567-5 (владелец 2026-10-22): «добавь к ним метку включён или выключен» — признак узла, не догадка. */}
                  <Badge variant={c.off != null ? "outline" : "secondary"} className={c.off != null ? "text-muted-foreground" : undefined} data-passport-power={c.off != null ? "off" : "on"}>
                    {c.off != null ? words.powerOff : words.powerOn}
                  </Badge>
                  {/* 566 (владелец 2026-10-22): звёздочка — элемент в сети Web4 (паспорт `visibility: network`), подсказка — его слова. */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="relative z-10 inline-flex" aria-label={c.web4 ? words.web4On : words.web4Off} data-passport-web4={c.web4 ? "on" : "off"}>
                          <Star className={c.web4 ? "size-4 fill-primary text-primary" : "size-4 text-muted-foreground"} aria-hidden />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{c.web4 ? words.web4On : words.web4Off}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>}
                lead={<>
                  <span className="line-clamp-1">{c.lead ?? words.noDescription}</span>
                  {/* 567: выключенный элемент — с причиной. */}
                  {c.off != null ? <span className="block text-sm font-medium text-muted-foreground" data-passport-off>{words.off} {c.off}</span> : null}
                </>}
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
