import type { Block } from '@/lib/content/blocks/types'
import { presentationWords } from '../_data/presentation'

// СОДЕРЖИМОЕ СТРАНИЦЫ «How it works» — презентация узла и его связи с Lagrix (шаг 535, слово владельца 2026-10-18 — в
// `../_data/presentation.ts`). Три уровня нумерации: раздел «1.» (h2) → часть «1.1» (h3) → нумерованный список. Сразу после вступления —
// карточка «панель открывать не обязательно»: владелец назвал её самым важным.
//
// 🛑 СЛОВА ОТСЮДА НЕ ПИШУТСЯ: любая строка, которую увидит человек, приходит из `_data` — иначе она не переводится и её не видит сторож
// словарей.
export function content(lang: string): Block[] {
  const w = presentationWords(lang)
  return [
    { kind: 'p', text: w.intro },
    // Кнопка карточки — подключение Telegram главного агента (владелец 2026-10-18: «add button … -> …/ru/build/telegram»).
    { kind: 'callout', title: w.card.title, text: w.card.text, action: { href: `/${lang}/build/telegram`, label: w.card.action } },
    ...w.sections.flatMap((s, i): Block[] => [
      { kind: 'h2', text: s.title },
      ...s.parts.flatMap((p): Block[] => [
        { kind: 'h3', text: p.title },
        { kind: 'olist', items: p.items },
      ]),
      // 535-3 (владелец 2026-10-18): в конце первого раздела — карточка о миссии Lagrix с кнопкой на главную lagrix.dev (en/ru).
      ...(i === 0
        ? [{ kind: 'callout', title: w.lagrixCard.title, text: w.lagrixCard.text, action: { href: `https://lagrix.dev/${lang === 'ru' ? 'ru' : 'en'}`, label: w.lagrixCard.action, external: true } } as Block]
        : []),
    ]),
  ]
}
