// СИГНАЛ «РЕШЕНИЕ ЗАПИСАНО» (шаг 556-13). Владелец 2026-10-23: «Ответ модели должен был создать реальную кнопку … Не просто текст в
// ленте». Дверь решения (`POST /api/node/reverse-report`) зовёт `emitReverse`, а страница «Реверс-инжиниринг» слушает
// `GET /api/node/reverse-report/events`, пока открыт ящик с терминалом, который открыл человек. Шина — `globalThis`: каждая дверь
// собирается отдельным модулем, а процесс ядра у них один, поэтому общая карта живёт не в модуле, а в процессе.

export type ReverseEvent = { kind: "verdict"; job: string; verdict: "continue" | "quiz"; at: string }
type Listener = (e: ReverseEvent) => void

const g = globalThis as typeof globalThis & { __web4ReverseEvents?: Set<Listener> }

function listeners(): Set<Listener> {
  if (!g.__web4ReverseEvents) g.__web4ReverseEvents = new Set()
  return g.__web4ReverseEvents
}

/** Сообщить всем открытым страницам. Ни одной — ничего не происходит: страница прочтёт решение при открытии или по «Обновить». */
export function emitReverse(e: ReverseEvent): void {
  for (const fn of listeners()) {
    try { fn(e) } catch { /* a closed page must not break the door */ }
  }
}

/** Подписка одной открытой страницы; возвращает отписку. */
export function onReverse(fn: Listener): () => void {
  listeners().add(fn)
  return () => { listeners().delete(fn) }
}
