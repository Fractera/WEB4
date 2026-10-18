import { MainAgentPage } from '../../../../../_lib/main-agent-page'
import { collectionMetadata } from '../../../../../_lib/collection-metadata'
import { StripeKeys } from '@/components/payments/stripe-keys.client'
import { paymentsUi } from '@/components/payments/payments.i18n'
import { data } from './_data'

// «Главный агент» → `/{lang}/architect/build/settings/payments/web2` (530-1): владелец 2026-10-18 — «На вкладке настройки создать вкладку платежи … веб два
// и web3 … Это нужно также сделать и в ядре». Общая оболочка: заголовок, строка о назначении, пункты под страницей, своя часть
// и эта же страница у элементов.
export const generateMetadata = collectionMetadata(data, '/architect/build/settings/payments')

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return <MainAgentPage lang={lang} rel="settings/payments/web2" page={data} own={<StripeKeys target="core" words={paymentsUi(lang).stripe} />} />
}
