"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ServerTableTools, SERVER_PER_PAGE, type ServerTableQuery } from "@/components/table/server-table-tools.client"
import { ALL_ROLES } from "@/lib/roles"
import type { TableUi } from "@/sections/table.i18n"
import type { NodeUsersUi } from "./node-users.i18n"

// ВКЛАДКА «ПОЛЬЗОВАТЕЛИ» ЭЛЕМЕНТА ВХОДА (узел, шаг 559). Страница ядра предрендерена; людей островок спрашивает в браузере у двери
// ядра `/api/node/users`, а та — у элемента входа, владельца людей. Каждое изменение поиска, отбора, сортировки или страницы — запрос.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export type NodeUserRow = {
  id: string; email: string; nickname: string | null; firstName: string | null; lastName: string | null; avatar: string | null
  roles: string[]; orgs: { id: string; name: string }[]; methods: string[]; status: "active" | "blocked" | "anonymized"
  createdAt: string; lastLoginAt: string | null; wallet: string | null; guest: boolean
  marketing: { granted: boolean; at: string } | null; tracking: { granted: boolean; at: string } | null; messengerCount: number
}
export type Org = { id: string; name: string; members: number }
type Filters = { org: string; role: string; sort: "created_desc" | "created_asc" }
type State = { kind: "loading" } | { kind: "error"; why: "forbidden" | "unreachable" | "failed" } | { kind: "ok"; rows: NodeUserRow[]; total: number }

export const ANY = "all"
export const fullName = (r: Pick<NodeUserRow, "firstName" | "lastName">) => [r.firstName, r.lastName].filter(Boolean).join(" ")

export function NodeUsers({ lang, ui, table }: { lang: string; ui: NodeUsersUi; table: TableUi }) {
  const [query, setQuery] = useState<ServerTableQuery>({ q: "", page: 1, perPage: SERVER_PER_PAGE[0] })
  const [filters, setFilters] = useState<Filters>({ org: ANY, role: ANY, sort: "created_desc" })
  const [state, setState] = useState<State>({ kind: "loading" })
  const [orgs, setOrgs] = useState<Org[]>([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setBusy(true)
    const p = new URLSearchParams({ page: String(query.page), perPage: String(query.perPage), sort: filters.sort })
    if (query.q) p.set("q", query.q)
    if (filters.org !== ANY) p.set("org", filters.org)
    if (filters.role !== ANY) p.set("role", filters.role)
    try {
      const r = await fetch(`${BASE}/api/node/users?${p}`, { cache: "no-store" })
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; rows?: NodeUserRow[]; total?: number }
      if (r.status === 401 || r.status === 403) setState({ kind: "error", why: "forbidden" })
      else if (r.status === 502 || r.status === 503) setState({ kind: "error", why: "unreachable" })
      else if (!j.ok || !j.rows) setState({ kind: "error", why: "failed" })
      else setState({ kind: "ok", rows: j.rows, total: j.total ?? 0 })
    } catch {
      setState({ kind: "error", why: "unreachable" })
    } finally {
      setBusy(false)
    }
  }, [query, filters])

  const loadOrgs = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/api/node/users/organizations`, { cache: "no-store" })
      const j = (await r.json().catch(() => ({}))) as { organizations?: Org[] }
      setOrgs(j.organizations ?? [])
    } catch { /* отборы без организаций — таблица всё равно работает */ }
  }, [])

  useEffect(() => { void load() }, [load])
  useEffect(() => { void loadOrgs() }, [loadOrgs])

  const date = (s: string) => new Date(s.replace(" ", "T") + "Z").toLocaleDateString(lang === "ru" ? "ru-RU" : "en-GB", { dateStyle: "medium" })
  const cell = "px-4 py-3 align-top"
  const setFilter = (next: Partial<Filters>) => { setFilters((f) => ({ ...f, ...next })); setQuery((q) => ({ ...q, page: 1 })) }

  if (state.kind === "loading") return <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> {ui.loading}</p>
  if (state.kind === "error") return <p className="text-sm text-destructive" role="alert" data-node-users-error={state.why}>{ui[state.why]}</p>

  const head = (
    <tr className="border-b border-border">
      {[ui.cols.user, ui.cols.email, ui.cols.roles, ui.cols.orgs, ui.cols.methods, ui.cols.status, ui.cols.created].map((h) => (
        <th key={h} scope="col" className={`${cell} font-semibold whitespace-nowrap text-foreground`}>{h}</th>
      ))}
    </tr>
  )

  const rows = state.rows.map((r) => {
    const gone = r.status === "anonymized"
    return (
      <tr key={r.id} className="border-b border-border last:border-0 text-muted-foreground" data-user-row={r.id} data-status={r.status}>
        <td className={cell}>
          <div className="flex items-center gap-3">
            {r.avatar && !gone
              ? <img alt="" className="size-8 shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" src={r.avatar} />
              : <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">{(r.nickname ?? "?").slice(0, 1).toUpperCase()}</span>}
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-foreground">{r.nickname || ui.noName}</span>
              <span className="truncate text-xs">{gone ? ui.anonymizedName : fullName(r) || (r.guest ? ui.guest : "")}</span>
            </div>
          </div>
        </td>
        <td className={`${cell} break-all`}>{gone ? ui.noName : r.email}</td>
        <td className={cell}><div className="flex flex-wrap gap-1">{r.roles.map((role) => <Badge key={role} variant="outline">{role}</Badge>)}</div></td>
        <td className={cell}>{r.orgs.length ? r.orgs.map((o) => o.name).join(", ") : ui.noName}</td>
        <td className={cell}>{r.methods.length ? r.methods.map((m) => ui.methods[m] ?? m).join(", ") : ui.noName}</td>
        <td className={cell}>
          <Badge variant={r.status === "active" ? "secondary" : r.status === "blocked" ? "destructive" : "outline"}>{ui.status[r.status]}</Badge>
        </td>
        <td className={`${cell} whitespace-nowrap`}>{date(r.createdAt)}</td>
      </tr>
    )
  })

  const filterBar = (
    <>
      <Select value={filters.org} onValueChange={(v) => setFilter({ org: v })}>
        <SelectTrigger className="h-9 w-48" aria-label={ui.filterOrg} data-filter="org">
          <SelectValue placeholder={ui.filterOrg} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{ui.filterOrg}: {ui.any}</SelectItem>
          {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name} ({o.members})</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.role} onValueChange={(v) => setFilter({ role: v })}>
        <SelectTrigger className="h-9 w-48" aria-label={ui.filterRole} data-filter="role">
          <SelectValue placeholder={ui.filterRole} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{ui.filterRole}: {ui.any}</SelectItem>
          {ALL_ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.sort} onValueChange={(v) => setFilter({ sort: v as Filters["sort"] })}>
        <SelectTrigger className="h-9 w-44" aria-label={ui.cols.created} data-filter="sort">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_desc">{ui.sortNewest}</SelectItem>
          <SelectItem value="created_asc">{ui.sortOldest}</SelectItem>
        </SelectContent>
      </Select>
    </>
  )

  return (
    <div className="flex max-w-6xl flex-col" data-node-users={state.total}>
      <ServerTableTools
        columns={7}
        filters={filterBar}
        head={head}
        loading={busy}
        onQuery={setQuery}
        onReset={() => {
          setFilters({ org: ANY, role: ANY, sort: "created_desc" })
          setQuery({ q: "", page: 1, perPage: SERVER_PER_PAGE[0] })
        }}
        query={query}
        rows={rows}
        total={state.total}
        words={table}
      />
    </div>
  )
}
