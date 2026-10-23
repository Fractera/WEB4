// @api stream recorded study decisions to an open reverse engineering page
import { NextRequest } from "next/server"
import { requireRoles } from "@/lib/auth/require-roles"
import { onReverse, type ReverseEvent } from "@/lib/study/reverse-events"

// СОБЫТИЯ СТРАНИЦЫ «РЕВЕРС-ИНЖИНИРИНГ» (шаг 556-13). Страница открывает этот поток, только пока открыт ящик с терминалом, который
// открыл человек, и закрывает его «Свернуть»: решение агента («продолжить» или «в квиз») появляется кнопкой без «Обновить».
// Опроса нет: ядро пишет в поток, когда дверь решения записала `verdict.json`. Пока поток открыт, раз в 25 с уходит строка-комментарий —
// иначе туннель Cloudflare закрывает молчащее соединение (около 100 с без данных). Кто вправе: архитектор/админ.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const denied = await requireRoles(req, ["architect", "admin"])
  if (denied) return denied
  const enc = new TextEncoder()
  let stop = () => {}
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (s: string) => { try { controller.enqueue(enc.encode(s)) } catch { stop() } }
      const off = onReverse((e: ReverseEvent) => write(`event: ${e.kind}\ndata: ${JSON.stringify(e)}\n\n`))
      const keep = setInterval(() => write(": keep\n\n"), 25_000)
      stop = () => {
        clearInterval(keep)
        off()
        try { controller.close() } catch { /* already closed */ }
      }
      req.signal.addEventListener("abort", () => stop(), { once: true })
      write(": open\n\n")
    },
    cancel() { stop() },
  })
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // no-transform: сжатие Next не трогает поток с этим заголовком, иначе события копились бы в буфере сжатия.
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  })
}
