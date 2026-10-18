import { CollectionPage } from '../../../../_lib/collection-page'
import { collectionMetadata } from '../../../../_lib/collection-metadata'
import { MainAgentElements } from '../../../../_components/main-agent-elements'
import { data } from './_data'
import { content } from './_components'

// СТРАНИЦА «Процесс» «Главного агента» — `/{lang}/architect/build/workflow/process` (528-3): заголовок, строка о назначении и эта же
// страница у root и каждого кастомного элемента. Сводных данных пока нет.
export const generateMetadata = collectionMetadata(data, '/architect/build/workflow')

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return <CollectionPage lang={lang} dir="/architect/build/workflow" page={data} content={content(lang)} widget={<MainAgentElements lang={lang} path="workflow/process" />} />
}
