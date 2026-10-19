// ГРАНИЦА АГЕНТА ЭЛЕМЕНТА (узел, шаг 548): `node scripts/element-isolate.mjs` — для каждого элемента узла.
//
// Слово владельца 2026-10-19: «когда работа идёт внутри элемента единственное что ему требуется от ядра это доступ к его файлу
// который содержит описание других элементов, и ядра … Мы не говорим о том что ему категорически запрещено выходить за свои
// пределы но чтобы он это сделал он должен явно спросить разрешения у архитектора».
//
// ✗ Замерено: агент элемента стартует в папке внутри узла, и Claude Code грузит каждый CLAUDE.md выше рабочей папки — инструкция
// ядра (252 361 знак, ≈95 тыс. токенов) ехала в каждый элемент на каждом шаге: 146 547 токенов на старте агента template.
//
// Пишет элементу `.claude/settings.local.json` (вне git, путь узла свой у каждой машины):
//   - `claudeMdExcludes` — CLAUDE.md ядра не грузится;
//   - `permissions.ask` — чтение и правка исходников ядра и папок других элементов только с ответа человека в терминале.
//     Свои данные элемента (`data/services/<id>`) и журналы узла порог не трогают. О составе узла элемент узнаёт из
//     `npm run passport -- project` (дверь ядра), не из файлов ядра.
// Запускают: рождение (`item-birth.mjs`), перенос папки (`element-move.mjs`), установка (`services-install.mjs`) — пути меняются.
// Свои строки файла сценарий узнаёт по пути узла и переписывает только их; чужие настройки элемента остаются.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const ITEMS = join(ROOT, 'WEB4-ITEMS')
const posix = (p) => p.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`)
const nodePosix = posix(ROOT)
// Исходники и документы ядра: всё в корне узла, кроме данных, журналов, зависимостей и самих элементов.
const OPEN = new Set(['data', 'logs', 'node_modules', 'WEB4-ITEMS', '.git', '.next', 'tsconfig.tsbuildinfo'])
const coreDirs = readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory() && !OPEN.has(d.name) && !d.name.startsWith('.next')).map((d) => d.name)

const elements = []
for (const kind of ['core', 'user']) {
  const base = join(ITEMS, kind)
  if (!existsSync(base)) continue
  for (const name of readdirSync(base, { withFileTypes: true })) if (name.isDirectory()) elements.push(join(base, name.name))
}

const excludes = [join(ROOT, 'CLAUDE.md'), join(ROOT, 'CLAUDE.md').replace(/\\/g, '/'), `${nodePosix}/CLAUDE.md`, join(ROOT, 'CLAUDE.local.md').replace(/\\/g, '/')]
const ours = (rule) => rule.includes(nodePosix)
let written = 0
for (const dir of elements) {
  if (!existsSync(join(dir, 'CLAUDE.md'))) continue
  const ask = []
  const guard = (p) => { ask.push(`Read(/${p})`, `Edit(/${p})`) }
  guard(`${nodePosix}/*`)
  for (const d of coreDirs) guard(`${nodePosix}/${d}/**`)
  for (const other of elements) if (other !== dir) guard(`${posix(other)}/**`)
  const file = join(dir, '.claude', 'settings.local.json')
  let s = {}
  try { s = JSON.parse(readFileSync(file, 'utf8')) } catch { /* нет файла — начинаем с пустого */ }
  s.claudeMdExcludes = [...(s.claudeMdExcludes ?? []).filter((x) => !excludes.includes(x)), ...excludes]
  s.permissions = s.permissions ?? {}
  s.permissions.ask = [...(s.permissions.ask ?? []).filter((r) => !ours(r)), ...ask]
  mkdirSync(join(dir, '.claude'), { recursive: true })
  writeFileSync(file, JSON.stringify(s, null, 2) + '\n', 'utf8')
  written++
}
console.log(`===ELEMENT_ISOLATE_OK=== элементов: ${written} · порог: исходники ядра (${coreDirs.length} папок + файлы корня) и ${elements.length - 1} соседей`)
