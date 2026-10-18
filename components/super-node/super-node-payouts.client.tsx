"use client"

import { useEffect, useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Spinner } from "@/components/ui/spinner"
import { TableTools } from "@/components/table/table-tools.client"
import type { TableUi } from "@/sections/table.i18n"
import type { SuperNodeWords } from "./super-node.i18n"

// «СУПЕР УЗЕЛ → ВЫПЛАТЫ» (530-3): таблица узла (`TableTools` — поиск сверху, страницы снизу, как «Проекты» и «Сделки») из
// `/api/node/super-node/payouts`; ниже — за что начисляются выплаты (док. Lagrix 09, 17, 24, 06, запись 52). Пусто — честная строка:
// выплаты начисляют контракты сети, а узел к ней не подключён. Спрашивается при открытии; опроса нет.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
type Payout = { at: string; period: string; kind: keyof SuperNodeWords["payouts"]["kinds"]; amount: number; note: string }

export function SuperNodePayouts({ lang, words, table }: { lang: string; words: SuperNodeWords; table: TableUi }) {
  const [rows, setRows] = useState<Payout[] | "loading" | "failed">("loading")
  useEffect(() => {
    fetch(`${BASE}/api/node/super-node/payouts`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { ok?: boolean; payouts?: Payout[] }) => setRows(j.ok ? j.payouts ?? [] : "failed"))
      .catch(() => setRows("failed"))
  }, [])

  const p = words.payouts
  const cell = "px-4 py-3 align-top"
  const money = new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })
  const head = <tr className="border-b border-border">{p.head.map((h) => <th key={h} scope="col" className={`${cell} font-semibold whitespace-nowrap text-foreground`}>{h}</th>)}</tr>

  return (
    <div className="flex max-w-5xl flex-col gap-4" data-super-node-payouts={typeof rows === "string" ? rows : rows.length}>
      {rows === "loading" && <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> {words.loading}</p>}
      {rows === "failed" && <p className="text-sm text-destructive" role="alert">{words.loadFailed}</p>}
      {Array.isArray(rows) && rows.length === 0 && <p className="text-sm text-muted-foreground" data-payouts-empty>{p.empty}</p>}
      {Array.isArray(rows) && rows.length > 0 && (
        <TableTools
          columns={p.head.length}
          head={head}
          rows={rows.map((r, i) => (
            <tr key={`${r.at}-${i}`} className="border-b border-border last:border-0 text-muted-foreground">
              <td className={cell}>{r.at.replace("T", " ").slice(0, 16)}</td>
              <td className={cell}>{r.period || "—"}</td>
              <td className={`${cell} text-foreground`}>{p.kinds[r.kind]}</td>
              <td className={`${cell} text-foreground`}>{money.format(r.amount)}</td>
              <td className={cell}>{r.note || "—"}</td>
            </tr>
          ))}
          texts={rows.map((r) => [r.at, r.period, p.kinds[r.kind], r.note].join(" "))}
          words={table}
        />
      )}
      <Accordion type="single" collapsible className="rounded-lg border border-border px-4">
        <AccordionItem value="what" className="border-b-0">
          <AccordionTrigger>{p.whatTitle}</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">{p.what.map((t) => <li key={t.slice(0, 40)}>{t}</li>)}</ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
