// РЕЖИМЫ СЕССИИ АГЕНТА ЭЛЕМЕНТА (узел, шаг 552-4). Одно место, которое знает: какое первое слово у запроса какого процесса, какие
// группы навыков видит сессия каждого режима и под каким ключом она живёт. Зовут мост комплекта (`_agent-kit/server/bridge.cjs`,
// при запуске сессии и пробуждении) и прибор `npm run check:modes` — второго списка групп нет нигде.
//
// Владелец 2026-10-20 (552): «разделить процессы и протестировать что они не пересекаются гарантировать что при работе режиме
// строительства не вызываются навыки мессенджера и навыки рабочего процесса»; и о первом слове: «каждый из этих процессов может
// отправлять первое слово: процесс строительства задача…». План 552-4а — «Подтвердить 552-4а (Рекомендую)»; конец сессии
// рабочего процесса — «Узел закрывает её сам (Рекомендую)».
//
// 🔒 Группа — плагин Claude Code `<группа>@skills-dir` (проба 552-1): сессия режима получает `enabledPlugins` своего набора в
// `--settings`; навыки выключенной группы для неё не существуют («Unknown skill»). `own-service-props-skills` — обнаружение, во
// всех режимах. Вендорные навыки (корень `.claude/skills`, рядом `SOURCE.md`) нужны строительству (по имени — это пишет
// `scripts/element-isolate.mjs`), в остальных режимах выключены.
// 🔒 Только у элемента с группами (есть `.claude/skills/build-skills/.claude-plugin/plugin.json`): остальные элементы, главный
// агент и службы ядра живут как прежде — одна сессия, без слова, без файлов режима.
// 🔒 Ключ сессии: строительство — id элемента (как всегда: его читают Telegram, страница терминала, «закончил»), рабочий процесс
// — `<id>--work` (двери `/api/agents/*` пропускают только `[a-z0-9-]`). «Messenger:» до шага 552-6 идёт в сессию строительства:
// Telegram живёт там.
const { existsSync, readdirSync } = require('node:fs')
const path = require('node:path')

const WORDS = { build: 'Build process:', work: 'Working process:', messenger: 'Messenger:' }
const COMMON = 'own-service-props-skills'
const GROUPS = { build: ['build-skills'], work: ['workspace-skills'], messenger: ['messenger-skills'] }
const ALL = ['build-skills', 'workspace-skills', 'messenger-skills', COMMON]
const WORK_SUFFIX = '--work'

/** Разложены ли навыки элемента по группам (шаг 552-2) — только у таких сессия живёт по режимам. */
function hasGroups(dir) {
  return Boolean(dir) && existsSync(path.join(dir, '.claude', 'skills', 'build-skills', '.claude-plugin', 'plugin.json'))
}

/** Режим по первому слову запроса или `null`, если слова нет. Сравнение без регистра и без ведущих пробелов. */
function modeOfText(text) {
  const head = String(text ?? '').trimStart().toLowerCase()
  for (const [mode, word] of Object.entries(WORDS)) if (head.startsWith(word.toLowerCase())) return mode
  return null
}

/** Запрос с первым словом своего процесса: слово уже стоит — как есть, нет — ставится впереди. */
function withWord(text, mode) {
  const t = String(text ?? '')
  return modeOfText(t) ? t : `${WORDS[mode]} ${t}`
}

/** В какую сессию идёт режим: до 552-6 у мессенджера своей сессии нет — Telegram живёт в строительстве. */
const sessionMode = (mode) => (mode === 'work' ? 'work' : 'build')
const sessionKey = (id, mode) => (sessionMode(mode) === 'work' ? `${id}${WORK_SUFFIX}` : id)
const baseOf = (key) => String(key ?? '').replace(new RegExp(`${WORK_SUFFIX}$`), '')
const modeOfKey = (key) => (String(key ?? '').endsWith(WORK_SUFFIX) ? 'work' : 'build')

/** Группы, которые видит сессия режима: свои плюс обнаружение. */
const visibleGroups = (mode) => [...GROUPS[mode], COMMON]

/** Вендорные навыки элемента — папки в корне `.claude/skills` с `SOURCE.md`. */
function vendored(dir) {
  const base = path.join(dir, '.claude', 'skills')
  if (!existsSync(base)) return []
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(path.join(base, d.name, 'SOURCE.md')))
    .map((d) => d.name)
}

/**
 * Настройки сессии режима для `claude --settings`: группы своего режима и обнаружения включены, остальные выключены; вне
 * строительства вендорные навыки выключены. `extraPlugins` — например, канал Telegram выключен у сессии без бота (548-20).
 */
function modeSettings(dir, mode, extraPlugins = {}) {
  const on = new Set(visibleGroups(mode))
  const enabledPlugins = Object.fromEntries(ALL.map((g) => [`${g}@skills-dir`, on.has(g)]))
  // ✗ Замерено живьём 552-4а (Haiku, сессия 7779380e): на «Unknown skill» агент прочёл SKILL.md чужой группы инструментом Read —
  // выключенная группа была закрыта для инструмента Skill и открыта для чтения файлом. Поэтому папки чужих групп сессии — `deny`
  // на чтение и правку (пути — от папки элемента, рабочей папки сессии).
  const foreign = ALL.filter((g) => !on.has(g)).map((g) => `./.claude/skills/${g}/**`)
  const out = { enabledPlugins: { ...enabledPlugins, ...extraPlugins }, permissions: { deny: foreign.flatMap((p) => [`Read(${p})`, `Edit(${p})`]) } }
  if (mode !== 'build') out.skillOverrides = Object.fromEntries(vendored(dir).map((n) => [n, 'off']))
  return out
}

/** Одна фраза системной подсказке сессии (`--append-system-prompt`): агент знает процесс своей сессии; инструкция по режимам — 552-5. */
function sessionNote(mode) {
  const own = sessionMode(mode) === 'work' ? 'the working process («Working process»)' : 'the build process («Build process»; messages from Telegram also come here until the messenger gets its own session)'
  return `This session of the element's agent is ${own}. A request that opens with the word of another process is not done in this session: name the section where it belongs.`
}

module.exports = { WORDS, GROUPS, COMMON, ALL, sessionNote, hasGroups, modeOfText, withWord, sessionMode, sessionKey, baseOf, modeOfKey, visibleGroups, vendored, modeSettings }
