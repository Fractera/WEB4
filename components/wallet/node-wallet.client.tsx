"use client"

import { useEffect, useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { NodeWalletWords } from "./node-wallet.i18n"

// КОШЕЛЁК УЗЛА — ОДИН ОСТРОВОК НА ЧЕТЫРЕ МЕСТА (530-1). Владелец 2026-10-18: «кладка с кошельком на уровне ядра будет продублировано её
// можно будет настроить и изнутри главного агента и из паспорта это нормально». Кошелёк один на узел (документ Lagrix 19): главная
// «Паспорта» (карточка в аккордеоне, 478-3), «Паспорт → Главный кошелёк», «Настройки → Платежи → Web3» главного агента и элемента —
// одна дверь `/api/node/wallet` и это тело. Ответ двери сразу меняет вид, без перезагрузки; опроса нет.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
type Wallet = { address: string } | null

/** Подключить, отключить и «без кошелька / с кошельком». `initial` — уже известное состояние (паспорт спрашивает его сам). */
export function NodeWalletBody({ words, initial }: { words: NodeWalletWords; initial?: Wallet }) {
  const [wallet, setWallet] = useState<Wallet | "loading">(initial === undefined ? "loading" : initial)
  const [address, setAddress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (initial !== undefined) { setWallet(initial); return }
    fetch(`${BASE}/api/node/wallet`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { wallet: Wallet }) => setWallet(d.wallet ? { address: d.wallet.address } : null))
      .catch(() => { setWallet(null); setError(words.failed) })
  }, [initial, words.failed])

  const send = async (method: "POST" | "DELETE") => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`${BASE}/api/node/wallet`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "POST" ? JSON.stringify({ address }) : undefined,
      })
      if (r.status === 422) { setError(words.badAddress); return }
      if (!r.ok) { setError(words.failed); return }
      const d = (await r.json()) as { wallet: Wallet }
      setWallet(d.wallet ? { address: d.wallet.address } : null)
      setAddress("")
    } catch {
      setError(words.failed)
    } finally {
      setBusy(false)
    }
  }

  const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`
  if (wallet === "loading") return <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> {words.loading}</p>
  return (
    <div className="flex flex-col gap-4" data-node-wallet={wallet ? "connected" : "none"}>
      {wallet ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">{words.connected}</span>
          <code className="font-mono text-base text-foreground" title={wallet.address}>{short(wallet.address)}</code>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => send("DELETE")}>{words.disconnect}</Button>
        </div>
      ) : (
        <>
          <form className="flex flex-wrap items-center gap-3" onSubmit={(e) => { e.preventDefault(); send("POST") }}>
            <Input className="max-w-md font-mono" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={words.placeholder} aria-label={words.placeholder} spellCheck={false} />
            <Button type="submit" disabled={busy || !address.trim()}>{words.connect}</Button>
          </form>
          <Accordion type="single" collapsible className="flex flex-col gap-4">
            <AccordionItem value="wallet-before" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4" data-wallet-before>
              <AccordionTrigger className="text-destructive">{words.beforeTitle}</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc space-y-1 pl-5 text-foreground">{words.before.map((x) => <li key={x}>{x}</li>)}</ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="wallet-after" className="rounded-lg border border-primary/30 bg-primary/5 px-4" data-wallet-after>
              <AccordionTrigger className="text-primary">{words.afterTitle}</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc space-y-1 pl-5 text-foreground">{words.after.map((x) => <li key={x}>{x}</li>)}</ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  )
}

/** Карточка кошелька для своих вкладок: заголовок, пояснение, тело; `note` — строка о месте (элемент, главный агент). */
export function NodeWalletCard({ words, note }: { words: NodeWalletWords; note?: string }) {
  return (
    <Card className="my-4 max-w-3xl" data-node-wallet-card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{words.title}</CardTitle>
        <CardDescription>{words.lead}</CardDescription>
        {note && <CardDescription className="text-foreground">{note}</CardDescription>}
      </CardHeader>
      <CardContent>
        <NodeWalletBody words={words} />
      </CardContent>
    </Card>
  )
}
