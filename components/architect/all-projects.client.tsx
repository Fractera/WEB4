"use client"

import { useEffect, useState } from "react"
import { DesktopNav, MobileMenu } from "@/components/shell/shell-menu.client"
import type { ShellGroup } from "@/components/shell/shell-types"

// «ВСЕ ПРОЕКТЫ» В ШАПКЕ СТРАНИЦ АРХИТЕКТОРА (узел, шаг 553). Слово владельца 2026-10-21: «вверху сделать кнопку: все проекты она будет
// выпадать вниз списком и показывать сайты вернее их главной страницы включая заголовок и описание так как мы сделали меню в проекте
// lagrix». Вид — мега-меню оболочки (как у сайтов элементов), данные — дверь ядра `/api/node/catalog` в браузере.
// 🔒 СОСТАВ УЗЛА НЕ ЗАПЕКАЕТСЯ В СБОРКУ ЯДРА (закон 264 «число о машине — спрашивать в браузере»): новый элемент появляется в
// списке при следующем открытии страницы, без пересборки ядра. Пока ответа нет или элементов нет — вкладки нет.

type Entry = { id: string; title: string; description: string; href: string | null; local: string | null }

export function AllProjects({ lang, label, menuLabel }: { lang: string; label: string; menuLabel: string }) {
  const [entries, setEntries] = useState<Entry[] | null>(null)

  useEffect(() => {
    let alive = true
    fetch(`/api/node/catalog?lang=${lang === "ru" ? "ru" : "en"}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((b: { entries?: Entry[] } | null) => { if (alive) setEntries(Array.isArray(b?.entries) ? b.entries : []) })
      .catch(() => { if (alive) setEntries([]) })
    return () => { alive = false }
  }, [lang])

  if (!entries || entries.length === 0) return null
  const group: ShellGroup = {
    slug: "all-projects",
    label,
    order: -1,
    childrenAsDropdown: true,
    roles: "public",
    catalog: true,
    // Своего домена у узла нет — карточка ведёт на элемент на этом компьютере.
    children: entries.map((e) => ({ slug: e.id, title: e.title, href: e.href ?? e.local ?? "#", ...(e.description ? { description: e.description } : {}) })),
  }
  return (
    <>
      <DesktopNav lang={lang} groups={[group]} meUrl="/api/me" />
      <MobileMenu lang={lang} groups={[group]} label={menuLabel} meUrl="/api/me" />
    </>
  )
}
