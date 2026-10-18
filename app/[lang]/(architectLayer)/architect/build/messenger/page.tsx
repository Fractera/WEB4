import { CollectionIndex } from '../../../_lib/collection-index'
import { collectionMetadata } from '../../../_lib/collection-metadata'
import { MainAgentElements } from '../../../_components/main-agent-elements'
import { data } from './_data'
import { content } from './_components'
import { PAGES } from './_list.generated'

// РАЗДЕЛ «Messenger» «Главного агента» — `/{lang}/architect/build/messenger` (528-3). Владелец 2026-10-18: у главного агента «такую же
// точно схему как … для элемента», с глобальными сводными страницами. Подразделы — папками рядом; ниже — эта же страница у элементов.
export const generateMetadata = collectionMetadata(data, '/architect/build')

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return (
    <CollectionIndex
      lang={lang}
      dir="/architect/build/messenger"
      page={data}
      pages={PAGES}
      content={content(lang)}
      widget={<MainAgentElements lang={lang} path="messenger" />}
    />
  )
}
