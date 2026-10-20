// ПРИБОР РЕЖИМОВ СЕССИИ (узел, шаг 552-4). Запуск: `npm run check:modes`. Без модели: для каждого элемента с группами навыков
// (WEB4-ITEMS/*/<элемент>/.claude/skills/build-skills/.claude-plugin/plugin.json) спрашивает ту же функцию, которой мост запускает
// сессию (`lib/agent-kit/modes.cjs` → `modeSettings`), и проверяет:
//   - наборы видимых групп режимов не пересекаются, кроме `own-service-props-skills` (обнаружение — во всех режимах);
//   - строительство не видит `workspace-skills` и `messenger-skills`;
//   - каждая группа-папка элемента названа в модуле: у групп `defaultEnabled: true`, и неназванная группа осталась бы включённой
//     во ВСЕХ режимах;
//   - вне строительства каждый вендорный навык выключен.
// Владелец 2026-10-20 (552): «разделить процессы и протестировать что они не пересекаются». Нарушение — код 1.
import { existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const modes = createRequire(import.meta.url)(join(ROOT, 'lib', 'agent-kit', 'modes.cjs'))
const MODES = ['build', 'work', 'messenger']
const problems = []
const dirs = (p) => (existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [])

const elements = []
for (const kind of dirs(join(ROOT, 'WEB4-ITEMS'))) {
  for (const name of dirs(join(ROOT, 'WEB4-ITEMS', kind))) {
    const dir = join(ROOT, 'WEB4-ITEMS', kind, name)
    if (modes.hasGroups(dir)) elements.push({ name, dir })
  }
}

for (const { name, dir } of elements) {
  const seen = {}
  for (const mode of MODES) {
    const s = modes.modeSettings(dir, mode)
    seen[mode] = new Set(Object.entries(s.enabledPlugins).filter(([k, v]) => v === true && k.endsWith('@skills-dir')).map(([k]) => k.replace(/@skills-dir$/, '')))
    if (!seen[mode].has(modes.COMMON)) problems.push(`${name} ${mode}: нет группы обнаружения ${modes.COMMON}`)
    // Выключенная группа закрыта и для чтения файлом (✗ 552-4а: агент прочёл SKILL.md чужой группы инструментом Read).
    for (const g of modes.ALL.filter((x) => !seen[mode].has(x))) {
      if (!(s.permissions?.deny ?? []).includes(`Read(./.claude/skills/${g}/**)`)) problems.push(`${name} ${mode}: папка чужой группы ${g} не закрыта для чтения`)
    }
    if (mode !== 'build') {
      for (const v of modes.vendored(dir)) if (s.skillOverrides?.[v] !== 'off') problems.push(`${name} ${mode}: вендорный навык ${v} не выключен`)
    }
  }
  for (const g of ['workspace-skills', 'messenger-skills']) if (seen.build.has(g)) problems.push(`${name} build: видит ${g}`)
  for (let i = 0; i < MODES.length; i++) {
    for (let j = i + 1; j < MODES.length; j++) {
      const both = [...seen[MODES[i]]].filter((g) => g !== modes.COMMON && seen[MODES[j]].has(g))
      if (both.length) problems.push(`${name}: режимы ${MODES[i]} и ${MODES[j]} оба видят ${both.join(', ')}`)
    }
  }
  const skills = join(dir, '.claude', 'skills')
  for (const g of dirs(skills).filter((d) => existsSync(join(skills, d, '.claude-plugin', 'plugin.json')))) {
    if (!modes.ALL.includes(g)) problems.push(`${name}: группа ${g} не названа в lib/agent-kit/modes.cjs — с defaultEnabled она включена во всех режимах`)
  }
}

if (!elements.length) problems.push('ни одного элемента с группами навыков — прибору нечего проверять (ожидался хотя бы template)')
if (problems.length) {
  console.error('===MODES_FAIL===')
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
console.log(`===MODES_OK=== элементов с группами: ${elements.length} (${elements.map((e) => e.name).join(', ')}); ` +
  MODES.map((m) => `${m}: ${modes.visibleGroups(m).join('+')}`).join(' · '))
