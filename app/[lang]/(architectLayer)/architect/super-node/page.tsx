import { CollectionIndex } from '../../_lib/collection-index'
import { collectionMetadata } from '../../_lib/collection-metadata'
import { AccordionSection } from '@/components/accordion/accordion-section.client'
import { SuperNodeApplication } from '@/components/super-node/super-node-application.client'
import { superNodeUi } from '@/components/super-node/super-node.i18n'
import { data } from './_data'
import { content } from './_components'
import { PAGES } from './_list.generated'

// ГРУППА «СУПЕР УЗЕЛ» — `/{lang}/architect/super-node` (530-3). Владелец 2026-10-18: «Под паспортом делаем ещё одно вкладку которую будет называться супер узел»; «главная страница опиши
// что такое супер узел и предложит подать заявку. Это же вкладка будет показывать уведомлений если заявка подано и ожидает одобрение если
// оно одобрена и ожидает интеграции». Что такое супер-узел и что нужно — по документам Lagrix 05 §5.6, 06, 14, 15; ниже — заявка.
export const generateMetadata = collectionMetadata(data, '/architect')

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const w = superNodeUi(lang)
  const para = (list: string[]) => <div className="flex flex-col gap-3 text-sm leading-relaxed">{list.map((t) => <p key={t.slice(0, 40)}>{t}</p>)}</div>
  return (
    <CollectionIndex
      lang={lang}
      dir="/architect/super-node"
      page={data}
      pages={PAGES}
      content={content(lang)}
      widget={
        <div className="mb-6 flex max-w-3xl flex-col gap-2">
          <AccordionSection
            defaultOpen="what"
            panels={[
              { id: 'what', summary: w.whatTitle, content: para(w.what) },
              { id: 'need', summary: w.needTitle, content: <ul className="list-disc space-y-1 pl-5 text-sm">{w.need.map((t) => <li key={t.slice(0, 40)}>{t}</li>)}</ul> },
            ]}
          />
          <SuperNodeApplication lang={lang} words={w} />
        </div>
      }
    />
  )
}
