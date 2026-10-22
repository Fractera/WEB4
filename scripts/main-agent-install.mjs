// ПАПКА ГЛАВНОГО АГЕНТА УЗЛА (узел, шаг 548-4): `npm run main-agent:install` — из `lib/main-agent/` в `data/main-agent`.
//
// Почему своя папка-репозиторий: Claude Code грузит каждый CLAUDE.md выше папки запуска и навыки проекта из неё и всех родителей до
// корня репозитория (code.claude.com/docs/en/memory, …/skills). Агент ядра, запущенный в корне узла, брал CLAUDE.md узла (252 361
// знак) и 61 навык корня на каждом запросе — 124 786 токенов до первого слова (548-6). `data/` вне git узла, а у папки свой `.git`:
// навыки корня сюда не доходят, CLAUDE.md узла снят `claudeMdExcludes`.
// 🔒 Файлы агента правятся в `lib/main-agent/`; здесь они переписываются при каждой установке. Свои данные агента (`data/
// services/build`) и чужие ключи настроек остаются. Зовут: `npm run main-agent:install` и `scripts/element-isolate.mjs`.

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { foreignOff } from '../lib/agent-kit/foreign-off.mjs'

export function installMainAgent(root) {
  const src = join(root, 'lib', 'main-agent')
  const dst = join(root, 'data', 'main-agent')
  if (!existsSync(join(src, 'main-agent-instruction.md'))) { console.log('===MAIN_AGENT_INSTALL_SKIP=== нет lib/main-agent'); return false }
  mkdirSync(join(dst, '.claude', 'skills'), { recursive: true })
  copyFileSync(join(src, 'main-agent-instruction.md'), join(dst, 'CLAUDE.md'))
  copyFileSync(join(src, 'package.json'), join(dst, 'package.json'))
  // 558-3: каталоги «Автоматизированного управления» (события и внешние сервисы) — как у элемента; расписание `data/` своё, вне git.
  mkdirSync(join(dst, 'OWN-SERVICE-PROPS'), { recursive: true })
  for (const f of ['CRON.json', 'SUBSCRIPTIONS.json']) if (existsSync(join(src, 'OWN-SERVICE-PROPS', f))) copyFileSync(join(src, 'OWN-SERVICE-PROPS', f), join(dst, 'OWN-SERVICE-PROPS', f))
  if (!existsSync(join(dst, '.gitignore'))) writeFileSync(join(dst, '.gitignore'), 'data/\n', 'utf8')
  const want = existsSync(join(src, 'skills')) ? readdirSync(join(src, 'skills'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []
  for (const old of readdirSync(join(dst, '.claude', 'skills'), { withFileTypes: true })) {
    if (old.isDirectory() && !want.includes(old.name)) rmSync(join(dst, '.claude', 'skills', old.name), { recursive: true, force: true })
  }
  // 548-18: a SKILL.md always lands with LF. Claude Code does not parse a frontmatter with CRLF and loads the skill with empty
  // metadata (`claude plugin validate`, measured 2026-10-20 on supervise-element); a Windows checkout gives CRLF.
  for (const name of want) {
    mkdirSync(join(dst, '.claude', 'skills', name), { recursive: true })
    writeFileSync(join(dst, '.claude', 'skills', name, 'SKILL.md'), readFileSync(join(src, 'skills', name, 'SKILL.md'), 'utf8').replace(/\r\n/g, '\n'), 'utf8')
  }
  // 569-3: встроенные инструменты Claude Code главного агента — только те, которыми он работает (команды, свои файлы, навыки); мост читает
  // этот файл (`lib/agent-kit/modes.cjs` `launchTools`). Замер: первый запрос 18 104 → 12 786 токенов. PowerShell есть только на Windows.
  writeFileSync(join(dst, '.claude', 'launch-tools.txt'), `${process.platform === 'win32' ? 'Bash,PowerShell,Read,Write,Edit,Skill' : 'Bash,Read,Write,Edit,Skill'}\n`, 'utf8')
  // 570 (закон владельца 2026-10-22, выбор «Sonnet — он пишет текст»): главный агент направляет и отвечает, код строят элементы.
  writeFileSync(join(dst, '.claude', 'launch-model.txt'), 'sonnet\n', 'utf8')
  // Свой корень репозитория: навыки корня узла выше него не грузятся.
  if (!existsSync(join(dst, '.git'))) {
    const r = spawnSync('git', ['init', '-q'], { cwd: dst, encoding: 'utf8', windowsHide: true })
    if (r.status !== 0) { console.log(`===MAIN_AGENT_INSTALL_FAIL=== git init: ${(r.stderr || '').trim()}`); return false }
  }
  const file = join(dst, '.claude', 'settings.local.json')
  let s = {}
  try { s = JSON.parse(readFileSync(file, 'utf8')) } catch { /* нет файла — начинаем с пустого */ }
  const posix = root.replace(/\\/g, '/')
  const excludes = [join(root, 'CLAUDE.md'), `${posix}/CLAUDE.md`, `${posix.replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`)}/CLAUDE.md`, `${posix}/CLAUDE.local.md`]
  s.claudeMdExcludes = [...new Set([...(s.claudeMdExcludes ?? []), ...excludes])]
  // 548-13: без блока чтения вне папки — с ним каждая команда с подоболочкой ждала бы человека, а главного агента будит событие.
  s.permissions = { ...(s.permissions ?? {}) }
  delete s.permissions.blockReadsOutsideWorkingDirectories
  const { settings } = foreignOff()
  const { skillOverrides, enabledPlugins, ...rest } = settings
  Object.assign(s, rest)
  s.skillOverrides = { ...(s.skillOverrides ?? {}), ...skillOverrides }
  s.enabledPlugins = { ...(s.enabledPlugins ?? {}), ...enabledPlugins }
  writeFileSync(file, JSON.stringify(s, null, 2) + '\n', 'utf8')
  const size = readFileSync(join(dst, 'CLAUDE.md'), 'utf8').length
  console.log(`===MAIN_AGENT_INSTALL_OK=== data/main-agent: CLAUDE.md ${size} знаков, навыки: ${want.join(', ')}`)
  return true
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) installMainAgent(process.cwd())
