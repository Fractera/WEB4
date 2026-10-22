// ВКЛЮЧИТЬ И ВЫКЛЮЧИТЬ ЭЛЕМЕНТ (узел, шаг 567). `npm run element:power -- <id> off "<причина>" | on | status`
// off — признак в реестре узла, затем процесс элемента и его сторож удаляются из pm2 и снимок `pm2 save` переписывается (иначе
// `pm2 resurrect` при загрузке поднял бы его снова). on — признак снят, оба процесса стартуют из ecosystem, ответ здоровья ждётся
// по факту, снимок переписывается. Строки `===POWER_OFF===` / `===POWER_ON===` / `===POWER_STATUS===` — для двери ядра и главного агента.
// 🔒 pm2 зовётся с чистым окружением: этот скрипт запускает и дверь ядра (`ANTI-PATTERNS.md`, «Процесс, запущенный из сервера Next…»).
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
// Корень узла — от места скрипта: главный агент зовёт команду из своей папки data/main-agent.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const power = require('../lib/web4-items/element-power.cjs')
const IS_WIN = process.platform === 'win32'
const say = (m) => console.log(m)

function childEnv() {
  const env = {}
  for (const [k, v] of Object.entries(process.env)) {
    if (/^(__NEXT|NEXT_|AGI_)/.test(k) || ['PORT', 'HOSTNAME', 'NODE_ENV'].includes(k)) continue
    env[k] = v
  }
  return env
}
const pm2 = (args) => spawnSync(IS_WIN ? 'pm2.cmd' : 'pm2', args, { cwd: ROOT, shell: IS_WIN, windowsHide: true, env: childEnv(), encoding: 'utf8' })

const [id, action, ...rest] = process.argv.slice(2)
if (!id || !['off', 'on', 'status'].includes(action ?? '')) {
  say('usage: npm run element:power -- <id> off "<reason>" | on | status')
  process.exit(2)
}
const entry = (power.readRegistry(ROOT).services || []).find((s) => s.id === id)
if (!entry) { say(`===POWER_FAILED=== unknown element «${id}»`); process.exit(1) }
const names = [`fractera-svc-${id}`, `fractera-svc-${id}-watch`]

if (action === 'status') {
  const off = power.offOf(entry)
  say(`===POWER_STATUS=== ${id} ${off ? `off since ${off.at}: ${power.reasonIn(off)}` : 'on'}`)
  process.exit(0)
}

if (action === 'off') {
  try { power.setOff(id, rest.join(' '), ROOT) } catch (e) { say(`===POWER_FAILED=== ${e.message}`); process.exit(1) }
  for (const n of names) pm2(['delete', n])
  pm2(['save'])
  say(`===POWER_OFF=== ${id}: ${power.reasonIn(power.offOf(power.readRegistry(ROOT).services.find((s) => s.id === id)))}`)
  process.exit(0)
}

// on
power.setOn(id, ROOT)
const r = pm2(['start', join(ROOT, 'ecosystem.config.cjs'), '--only', names.join(',')])
if (r.status !== 0) { say(`===POWER_FAILED=== pm2 start: ${(r.stderr || r.stdout || '').trim().split('\n').pop()}`); process.exit(1) }
const health = require('../lib/web4-items/element-props.cjs').readElementProps(require('../lib/web4-items/paths.cjs').entryDir(entry))?.health?.path ?? '/'
let answered = 0
for (let i = 0; i < 60 && !answered; i++) {
  try {
    const res = await fetch(`http://127.0.0.1:${entry.port}${health}`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) answered = res.status
  } catch { /* ещё поднимается */ }
  if (!answered) await new Promise((res) => setTimeout(res, 1000))
}
pm2(['save'])
say(answered ? `===POWER_ON=== ${id} answers ${health} → ${answered}` : `===POWER_ON=== ${id} started, but did not answer ${health} within a minute — logs/svc-${id}-err.log`)
