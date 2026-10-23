import type { Block } from '@/lib/content/blocks/types'

// 579-4: страница — переадресация на сам корневой сайт (page.tsx); своего содержимого в ядре нет.
export function content(_lang: string): Block[] {
  return []
}
