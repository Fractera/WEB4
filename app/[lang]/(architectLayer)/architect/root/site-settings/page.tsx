import { redirect } from 'next/navigation'
import { coreShellWhere } from '@/lib/shell/core-shell-where'
import { collectionMetadata } from '../../../_lib/collection-metadata'
import { data } from './_data'

// 579-4 (владелец 2026-10-23): «Site settings» у root — только переадресация на `/<язык>/admin/site-settings` самого корневого сайта, в ядре ничего не
// строится (как «Строительство → Site settings» у элементов дерева). Адрес сайта — тот же, что у оболочки проекта: на своём домене корень
// зоны, иначе петля с портом сайта. Пункт меню открывается в новой вкладке (`meta.newTab`).
export const dynamic = 'force-dynamic'
export const generateMetadata = collectionMetadata(data, '/architect/root')

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const site = coreShellWhere().siteUrl
  if (!site) redirect(`/${lang}/architect/root`)
  redirect(`${site.replace(/\/+$/, '')}/${lang}/admin/site-settings`)
}
