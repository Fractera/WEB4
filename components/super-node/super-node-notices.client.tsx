"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import type { SuperNodeWords } from "./super-node.i18n"

// «СУПЕР УЗЕЛ → УВЕДОМЛЕНИЯ LAGRIX» (530-3): параметры этой машины против профиля Tier-2 (док. Lagrix 14) — подсветка «удовлетворяет / не
// удовлетворяет / здесь не измеряется» и общий вывод; ниже — предупреждения о недостаточной мощности (запись 45), сегодня их нет, потому
// что сеть не подключена. Обе двери спрашиваются при открытии (число о машине — в браузере); опроса нет.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
type Facts = { platform: string; cpus: number; cpuModel: string; aes: boolean | null; ramGb: number; diskTotalGb: number | null; diskFreeGb: number | null }
type Tier = { cpus: number; ramGb: number; diskGb: number }
type Warning = { at: string; text: string; deadline?: string }
type Verdict = "ok" | "short" | "unknown"

export function SuperNodeNotices({ lang, words }: { lang: string; words: SuperNodeWords }) {
  const [machine, setMachine] = useState<{ facts: Facts; tier2: Tier } | "loading" | "failed">("loading")
  const [warnings, setWarnings] = useState<Warning[] | "loading" | "failed">("loading")

  useEffect(() => {
    fetch(`${BASE}/api/node/super-node/machine`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { ok?: boolean; facts?: Facts; tier2?: Tier }) => setMachine(j.ok && j.facts && j.tier2 ? { facts: j.facts, tier2: j.tier2 } : "failed"))
      .catch(() => setMachine("failed"))
    fetch(`${BASE}/api/node/super-node`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { ok?: boolean; warnings?: Warning[] }) => setWarnings(j.ok ? j.warnings ?? [] : "failed"))
      .catch(() => setWarnings("failed"))
  }, [])

  const m = words.machine
  const badge = (v: Verdict) =>
    v === "ok" ? <Badge variant="secondary" data-verdict="ok">{m.ok}</Badge>
      : v === "short" ? <Badge variant="destructive" data-verdict="short">{m.short}</Badge>
        : <Badge variant="outline" data-verdict="unknown">{m.notMeasured}</Badge>
  const date = (iso: string) => new Date(iso).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-GB", { dateStyle: "medium" })

  let table = null
  let verdict = null
  if (machine !== "loading" && machine !== "failed") {
    const { facts: f, tier2: t } = machine
    const gb = (n: number | null) => (n === null ? "—" : `${n.toLocaleString(lang === "ru" ? "ru-RU" : "en-US")} GB`)
    const rows: [string, string, string, Verdict][] = [
      [m.rows.cpus, `${t.cpus} vCPU`, `${f.cpus}${f.cpuModel ? ` · ${f.cpuModel}` : ""}`, f.cpus >= t.cpus ? "ok" : "short"],
      [m.rows.aes, "AES-NI", f.aes === null ? "—" : f.aes ? "AES-NI" : "—", f.aes === null ? "unknown" : f.aes ? "ok" : "short"],
      [m.rows.ram, `${t.ramGb} GB`, gb(f.ramGb), f.ramGb >= t.ramGb ? "ok" : "short"],
      [m.rows.disk, `${t.diskGb} GB NVMe`, gb(f.diskTotalGb), f.diskTotalGb === null ? "unknown" : f.diskTotalGb >= t.diskGb ? "ok" : "short"],
      [m.rows.free, "—", gb(f.diskFreeGb), "unknown"],
      [m.rows.bandwidth, "1 Gbit/s", "—", "unknown"],
      [m.rows.ipv4, "IPv4", "—", "unknown"],
      [m.rows.ipv6, "/64", "—", "unknown"],
    ]
    const shortOf = rows.filter((r) => r[3] === "short").map((r) => r[0])
    verdict = (
      <p className={shortOf.length ? "text-sm font-medium text-destructive" : "text-sm font-medium text-foreground"} data-machine-verdict={shortOf.length ? "short" : "ok"}>
        {shortOf.length ? m.verdictShort.replace("{list}", shortOf.join(", ")) : m.verdictOk}
      </p>
    )
    const cell = "px-3 py-2 align-top"
    table = (
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm" data-machine-table>
          <thead className="border-b border-border bg-muted/40">
            <tr>{m.head.map((h) => <th key={h} scope="col" className={`${cell} font-semibold text-foreground`}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(([name, need, have, v]) => (
              <tr key={name} className="border-b border-border last:border-0" data-machine-row={v}>
                <td className={`${cell} text-foreground`}>{name}</td>
                <td className={`${cell} text-muted-foreground`}>{need}</td>
                <td className={`${cell} text-foreground`}>{have}</td>
                <td className={cell}>{badge(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Card data-super-node-machine={typeof machine === "string" ? machine : "ready"}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{m.title}</CardTitle>
          <CardDescription>{m.lead}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {machine === "loading" && <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> {words.loading}</p>}
          {machine === "failed" && <p className="text-sm text-destructive" role="alert">{words.loadFailed}</p>}
          {verdict}
          {table}
          {machine !== "loading" && machine !== "failed" && <p className="text-[length:var(--fs-small)] text-muted-foreground">{machine.facts.platform}. {m.homeNote}</p>}
        </CardContent>
      </Card>
      <Card data-super-node-warnings={typeof warnings === "string" ? warnings : warnings.length}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{words.warnings.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {warnings === "loading" && <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> {words.loading}</p>}
          {warnings === "failed" && <p className="text-sm text-destructive" role="alert">{words.loadFailed}</p>}
          {Array.isArray(warnings) && warnings.length === 0 && <p className="text-sm text-muted-foreground">{words.warnings.none}</p>}
          {Array.isArray(warnings) && warnings.map((w) => (
            <div key={w.at + w.text} className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm" role="alert">
              <p className="font-medium text-foreground">{w.text}</p>
              <p className="text-muted-foreground">{date(w.at)}{w.deadline ? ` · ${words.warnings.deadline.replace("{date}", date(w.deadline))}` : ""}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
