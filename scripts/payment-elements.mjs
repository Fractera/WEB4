// ПЛАТЁЖНЫЕ ЭЛЕМЕНТЫ УЗЛА (551-5). Запуск из корня узла: `npm run items:payments` (`-- --dry-run` — только напечатать план).
//
// 🎯 Слово владельца 2026-10-20: «Так как у нас в данный момент f2f пока ещё не работает мы установим внутрь проекта по умолчанию два
// платёжных кастомных элем : Stripe Lava.top»; где — «В каждый узел при установке» (цена названа: память каждого и две сборки при первом
// запуске). Путь в будущем: платёжный элемент приходит по f2f, соседи договариваются с ним по i2i и строят API.
//
// Для каждого элемента из `WEB4-ITEMS-REGISTRY/payment-elements.json`, по одному:
//   1. есть в реестре узла — «уже есть», рождение отмечается в `data/node/payment-elements.json`;
//   2. рождался раньше, а в реестре его нет — человек удалил его сам: не возвращаю;
//   3. иначе — черновик в `data/web4-drafts.json` (как кнопка «Создать WEB4 ITEM»), рождение `item-birth.mjs <id> --look project` (шаблон,
//      своя история, реестр, установка, pm2, ожидание здоровья, граница агента), затем паспорт: имя, описание, `payment: { tool, name }` —
//      и коммит в истории элемента.
// Перед каждым рождением печатается свободная память (сборка элемента — минуты и сотни мегабайт). В конце, если кто-то родился, слой ядра
// перерисовывается (`/api/revalidate`), чтобы левое меню показало новые элементы без пересборки.
//
// 🔒 Зовёт его первый запуск узла (`scripts/serve.mjs`) и человек; повтор безвреден. Таймеров, опроса и повторов при отказе нет.
// 🔒 Процессы — `windowsHide: true`; `item-birth.mjs` сам чистит окружение для pm2 (закон 351).

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { freemem } from 'node:os'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { REGISTRY_FILE, entryDir } = require('../lib/web4-items/paths.cjs')

const ROOT = process.cwd()
const LIST_FILE = join(ROOT, 'WEB4-ITEMS-REGISTRY', 'payment-elements.json')
const MARK_FILE = join(ROOT, 'data', 'node', 'payment-elements.json')
const DRAFTS_FILE = join(ROOT, 'data', 'web4-drafts.json')
const DRY = process.argv.includes('--dry-run')
const say = (m) => console.log(m)

const readJson = (file, fallback) => { try { return JSON.parse(readFileSync(file, 'utf8')) } catch { return fallback } }
function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.tmp-${process.pid}`
  writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', 'utf8')
  renameSync(tmp, file)
}

const list = readJson(LIST_FILE, null)?.elements
if (!Array.isArray(list)) { say(`===PAYMENTS_FAILED=== нет списка ${LIST_FILE}`); process.exit(1) }
const mark = readJson(MARK_FILE, { born: {} })
mark.born = mark.born ?? {}

let born = 0
let failed = 0
for (const el of list) {
  const registry = readJson(REGISTRY_FILE, { services: [] })
  const entry = (registry.services ?? []).find((s) => s.id === el.id)
  if (entry) {
    say(`── ${el.id} (${el.name}) — уже есть в узле`)
    if (!mark.born[el.id] && !DRY) { mark.born[el.id] = entry.born?.at ?? new Date().toISOString(); writeJson(MARK_FILE, mark) }
    continue
  }
  if (mark.born[el.id]) { say(`── ${el.id} (${el.name}) — рождался ${mark.born[el.id]}, в узле его нет: удалён человеком, не возвращаю`); continue }
  if (DRY) { say(`── ${el.id} (${el.name}) — родил бы из кастомного шаблона (dry-run)`); continue }

  say(`── ${el.id} (${el.name}) — рождаю; свободно памяти ${Math.round(freemem() / 1048576)} МБ`)
  const drafts = readJson(DRAFTS_FILE, { drafts: [] })
  drafts.drafts = Array.isArray(drafts.drafts) ? drafts.drafts : []
  if (!drafts.drafts.some((d) => d?.id === el.id)) {
    drafts.drafts.push({ id: el.id, createdAt: new Date().toISOString() })
    writeJson(DRAFTS_FILE, drafts)
  }
  const birth = spawnSync(process.execPath, [join(ROOT, 'scripts', 'item-birth.mjs'), el.id, '--look', 'project'], { cwd: ROOT, stdio: 'inherit', windowsHide: true })
  const after = readJson(REGISTRY_FILE, { services: [] }).services?.find((s) => s.id === el.id)
  if (!after) { say(`  рождение «${el.id}» не дошло до реестра (код ${birth.status}) — повтор: npm run items:payments`); failed++; continue }
  // Отметка — как только элемент в реестре: даже упавшая позже установка не рождает его второй раз (повтор — установщиком, печатает рождение).
  mark.born[el.id] = after.born?.at ?? new Date().toISOString()
  writeJson(MARK_FILE, mark)
  if (birth.status !== 0) { say(`  «${el.id}» записан в реестр, но установка не закончилась (код ${birth.status}) — повтор: npm run services:install -- --only ${el.id}`); failed++; continue }

  // Паспорт платёжного элемента: кто он и какой инструмент несёт. Остальные поля — как у рождённого.
  const dir = entryDir(after)
  const passportFile = join(dir, 'OWN-SERVICE-PROPS', 'OWN-SERVICE-PROPS.json')
  if (existsSync(passportFile)) {
    const raw = readFileSync(passportFile, 'utf8')
    const p = JSON.parse(raw)
    p.name = el.name
    p.shortDescription = el.shortDescription
    p.payment = { tool: el.tool, name: el.name }
    let out = JSON.stringify(p, null, 2) + '\n'
    if (raw.includes('\r\n')) out = out.replace(/\n/g, '\r\n')
    writeFileSync(passportFile, out, 'utf8')
    const ident = ['-c', 'user.name=Fractera node', '-c', 'user.email=node@fractera.local']
    spawnSync('git', ['add', 'OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json'], { cwd: dir, windowsHide: true })
    const c = spawnSync('git', [...ident, 'commit', '--quiet', '-m', `Payment element: ${el.name} (node step 551-5)`], { cwd: dir, windowsHide: true, encoding: 'utf8' })
    say(c.status === 0 ? `  паспорт: ${el.name}, payment.tool = ${el.tool} — закоммичен` : `  паспорт записан, коммит не удался: ${(c.stderr || c.stdout || '').trim().split('\n').slice(-1)[0]}`)
  } else {
    say(`  у «${el.id}» нет паспорта ${passportFile} — платёжная запись не сделана`)
    failed++
  }
  born++
}

if (born > 0) {
  // Меню ядра — данные узла: перерисовка слоя, а не пересборка. Порт ядра — из файла, который пишет сам сервер.
  const port = readJson(join(ROOT, 'logs', 'runtime.json'), null)?.port
  if (port) {
    try { await fetch(`http://localhost:${port}/api/revalidate`, { method: 'POST', signal: AbortSignal.timeout(15000) }) } catch { /* перерисует ISR */ }
  }
}
say(failed ? `===PAYMENTS_FAILED=== родилось ${born}, отказов ${failed}` : `===PAYMENTS_OK=== родилось ${born}${DRY ? ' (dry-run)' : ''}`)
process.exit(failed ? 1 : 0)
