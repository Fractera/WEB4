// ГРАНИЦА АГЕНТА ЭЛЕМЕНТА (узел, шаг 548): `node scripts/element-isolate.mjs` — для каждого элемента узла.
//
// Слово владельца 2026-10-19: «когда работа идёт внутри элемента единственное что ему требуется от ядра это доступ к его файлу
// который содержит описание других элементов, и ядра … Мы не говорим о том что ему категорически запрещено выходить за свои
// пределы но чтобы он это сделал он должен явно спросить разрешения у архитектора».
//
// ✗ Замерено: агент элемента стартует в папке внутри узла, и Claude Code грузит каждый CLAUDE.md выше рабочей папки — инструкция
// ядра (252 361 знак, ≈95 тыс. токенов) ехала в каждый элемент на каждом шаге: 146 547 токенов на старте агента template.
// ✗ Замерено 548-6 (журнал 22:02): в списке навыков 82 имени, у 23 нет описания — среди них свои `product-quiz`,
// `node-elements-detection`, `own-service-props-detection`. Бюджет списка — 1 % окна, и при переполнении Claude Code снимает
// описания у наименее вызываемых навыков (code.claude.com/docs/en/skills, «Skill descriptions are cut short»); место занимали
// 34 чужих навыка: федеральные из `~/.claude/skills`, встроенные Claude Code, навыки и плагины claude.ai.
//
// Пишет элементу `.claude/settings.local.json` (вне git, путь узла свой у каждой машины):
//   - `claudeMdExcludes` — CLAUDE.md ядра не грузится;
//   - `permissions.blockReadsOutsideWorkingDirectories` — файловые инструменты отказывают вне рабочих папок в любом режиме;
//   - `permissions.ask` — чтение и правка исходников ядра и папок других элементов только с ответа человека в терминале;
//   - хук `PreToolUse` (`scripts/element-boundary-hook.mjs`) — команда оболочки или записываемый файл, где назван путь вне своей
//     папки, спрашивает человека (548-7: правила не видят node-скриптов, а песочницы на Windows нет);
//   - чужие навыки выключены: свои навыки `~/.claude/skills` — `off`, встроенные — `disableBundledSkills`, claude.ai —
//     `syncClaudeAiSkills`/`syncClaudeAiPlugins: false` (в локальных настройках только не грузятся, файлы не переносятся),
//     плагины пользователя, кроме Telegram, — `enabledPlugins: false`, коннекторы claude.ai — `disableClaudeAiConnectors`;
//   - вендорные навыки (рядом `SOURCE.md`) — `name-only`: их зовут по имени навыки-привратники и инструкция;
//   - `skillListingBudgetFraction` — столько, чтобы описания всех своих навыков помещались (меньше 1 % не ставится).
//   Свои данные элемента (`data/services/<id>`) и журналы узла порог не трогают. О составе узла элемент узнаёт из
//   `npm run passport -- project` (дверь ядра), не из файлов ядра.
// Запускают: рождение (`item-birth.mjs`), перенос папки (`element-move.mjs`), установка (`services-install.mjs`) — пути меняются.
// Свои строки файла сценарий узнаёт по пути узла и переписывает только их; чужие настройки элемента остаются.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const ROOT = process.cwd()
const ITEMS = join(ROOT, 'WEB4-ITEMS')
const HOME = homedir()
const posix = (p) => p.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`)
const nodePosix = posix(ROOT)
// Исходники и документы ядра: всё в корне узла, кроме данных, журналов, зависимостей и самих элементов.
const OPEN = new Set(['data', 'logs', 'node_modules', 'WEB4-ITEMS', '.git', '.next', 'tsconfig.tsbuildinfo'])
const coreDirs = readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory() && !OPEN.has(d.name) && !d.name.startsWith('.next')).map((d) => d.name)
const HOOK = join(ROOT, 'scripts', 'element-boundary-hook.mjs').replace(/\\/g, '/')
const KEEP_PLUGIN = 'telegram@claude-plugins-official'

/** Одно поле фронтматтера SKILL.md (многострочное — склеенным). */
function field(text, key) {
  const lines = text.replace(/\r/g, '').split('\n')
  if (lines[0]?.trim() !== '---') return ''
  const end = lines.indexOf('---', 1)
  const fm = lines.slice(1, end > 0 ? end : undefined)
  const i = fm.findIndex((l) => l.startsWith(`${key}:`))
  if (i < 0) return ''
  const out = [fm[i].slice(key.length + 1)]
  for (let j = i + 1; j < fm.length && !/^[A-Za-z_-]+:/.test(fm[j]); j++) out.push(fm[j])
  return out.join(' ').replace(/^\s*[>|][-+]?/, '').replace(/\s+/g, ' ').trim()
}
const readText = (f) => { try { return readFileSync(f, 'utf8') } catch { return '' } }

// Навыки самого человека (`~/.claude/skills`, кроме синхронизированных с claude.ai) — у элемента их нет.
const userSkills = (() => {
  const base = join(HOME, '.claude', 'skills')
  if (!existsSync(base)) return []
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'synced' && !d.name.startsWith('.'))
    .map((d) => field(readText(join(base, d.name, 'SKILL.md')), 'name') || d.name)
})()
// Плагины, включённые пользователем, кроме Telegram (канал агента).
const userPlugins = (() => {
  try { return Object.entries(JSON.parse(readText(join(HOME, '.claude', 'settings.json'))).enabledPlugins ?? {}).filter(([k, v]) => v && k !== KEEP_PLUGIN).map(([k]) => k) } catch { return [] }
})()

/** Свои навыки элемента: сколько знаков займут в списке с описаниями и какие из них вендорные. */
function ownSkills(dir) {
  const base = join(dir, '.claude', 'skills')
  if (!existsSync(base)) return { chars: 0, vendor: [] }
  let chars = 0
  const vendor = []
  for (const d of readdirSync(base, { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    const text = readText(join(base, d.name, 'SKILL.md'))
    if (!text) continue
    const name = field(text, 'name') || d.name
    if (existsSync(join(base, d.name, 'SOURCE.md'))) { vendor.push(name); chars += name.length + 4; continue }
    chars += name.length + 4 + `${field(text, 'description')} ${field(text, 'when_to_use')}`.trim().slice(0, 1536).length
  }
  return { chars, vendor }
}

const elements = []
for (const kind of ['core', 'user']) {
  const base = join(ITEMS, kind)
  if (!existsSync(base)) continue
  for (const name of readdirSync(base, { withFileTypes: true })) if (name.isDirectory()) elements.push(join(base, name.name))
}

const idOf = (dir) => {
  for (const f of [join(dir, 'OWN-SERVICE-PROPS', 'OWN-SERVICE-PROPS.json'), join(dir, 'OWN-SERVICE-PROPS.json')]) {
    try { const id = JSON.parse(readText(f)).id; if (typeof id === 'string' && id) return id } catch { /* нет паспорта */ }
  }
  return dir.split(/[\\/]/).pop()
}

// Сколько знаков списка помещается в 1 % окна — замерено 548-6: 29 994 знака у переполненного списка (журнал 22:02).
const BUDGET_AT_ONE_PERCENT = 28_000
const PLUGIN_SKILLS_CHARS = 1_500

const excludes = [join(ROOT, 'CLAUDE.md'), join(ROOT, 'CLAUDE.md').replace(/\\/g, '/'), `${nodePosix}/CLAUDE.md`, join(ROOT, 'CLAUDE.local.md').replace(/\\/g, '/')]
const ours = (rule) => rule.includes(nodePosix)
let written = 0
const report = []
for (const dir of elements) {
  if (!existsSync(join(dir, 'CLAUDE.md'))) continue
  const id = idOf(dir)
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
  s.permissions.blockReadsOutsideWorkingDirectories = true

  // Сторож путей: своя запись узнаётся по имени сценария и переписывается целиком.
  const hookCmd = `node "${HOOK}" --dir "${dir.replace(/\\/g, '/')}" --data "${join(ROOT, 'data', 'services', id).replace(/\\/g, '/')}" --root "${ROOT.replace(/\\/g, '/')}"`
  const pre = (s.hooks?.PreToolUse ?? []).filter((m) => !(m.hooks ?? []).some((h) => String(h.command ?? '').includes('element-boundary-hook.mjs')))
  s.hooks = { ...(s.hooks ?? {}), PreToolUse: [...pre, { matcher: 'Bash|PowerShell|Write|Edit|MultiEdit|NotebookEdit', hooks: [{ type: 'command', command: hookCmd }] }] }

  // Чужие навыки и плагины — вон из списка; вендорные — по имени.
  const own = ownSkills(dir)
  const overrides = { ...(s.skillOverrides ?? {}) }
  for (const n of userSkills) overrides[n] = 'off'
  for (const n of own.vendor) overrides[n] = 'name-only'
  s.skillOverrides = overrides
  s.disableBundledSkills = true
  s.syncClaudeAiSkills = false
  s.syncClaudeAiPlugins = false
  s.disableClaudeAiConnectors = true
  s.enabledPlugins = { ...(s.enabledPlugins ?? {}), ...Object.fromEntries(userPlugins.map((p) => [p, false])) }
  const need = (own.chars + PLUGIN_SKILLS_CHARS) / BUDGET_AT_ONE_PERCENT
  const fraction = Math.min(0.02, Math.max(0.01, Math.ceil(need * 1.08 * 1000) / 100000))
  if (fraction > 0.01) s.skillListingBudgetFraction = fraction
  else delete s.skillListingBudgetFraction

  mkdirSync(join(dir, '.claude'), { recursive: true })
  writeFileSync(file, JSON.stringify(s, null, 2) + '\n', 'utf8')
  written++
  report.push(`${id}: список своих навыков ${own.chars} знаков, бюджет ${fraction}`)
}
console.log(report.join('\n'))
console.log(`===ELEMENT_ISOLATE_OK=== элементов: ${written} · порог: исходники ядра (${coreDirs.length} папок + файлы корня) и ${elements.length - 1} соседей · чужих навыков выключено: ${userSkills.length}, плагинов: ${userPlugins.length}`)
