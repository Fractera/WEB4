import { redirect } from 'next/navigation'
import { coreShellWhere } from '@/lib/shell/core-shell-where'
import { collectionMetadata } from '../../../_lib/collection-metadata'
import { data } from './_data'

// 578-6 (владелец 2026-10-23): «Blocks» у root — только переадресация на `/<язык>/admin/blocks` самого корневого сайта, в ядре ничего не
// строится (как «Строительство → Blocks» у элементов дерева). Адрес сайта — тот же, что у оболочки проекта: на своём домене корень
// зоны, иначе петля с портом сайта. Пункт меню открывается в новой вкладке (`meta.newTab`).
export const dynamic = 'force-dynamic'
export const generateMetadata = collectionMetadata(data, '/architect/root')

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const site = coreShellWhere().siteUrl
  if (!site) redirect(`/${lang}/architect/root`)
  redirect(`${site.replace(/\/+$/, '')}/${lang}/admin/blocks`)
}
