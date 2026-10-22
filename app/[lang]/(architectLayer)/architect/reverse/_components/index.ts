import type { Block } from '@/lib/content/blocks/types'
import { servicePortWords } from '@/components/services/service-port.i18n'

// СОДЕРЖИМОЕ СТРАНИЦЫ «Реверс-инжиниринг» (563-1) — как у «Быстрого хранилища»: где элемент живёт (порт на машине, адрес в интернете).
// Элемент приходит выключенным по своему паспорту (567): причину называет плашка страниц элемента, процесса нет, пока узел его не включит.
// 🛑 Слова отсюда не пишутся — они приходят из `_data`.
export function content(lang: string): Block[] {
  return [{ kind: 'servicePort', serviceId: 'reverse', words: servicePortWords(lang, 'reverse') }]
}
