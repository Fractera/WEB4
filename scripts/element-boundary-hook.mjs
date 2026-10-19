// СТОРОЖ ГРАНИЦЫ АГЕНТА ЭЛЕМЕНТА (узел, шаг 548-7) — хук Claude Code `PreToolUse`, его ставит `scripts/element-isolate.mjs`.
//
// Слово владельца 2026-10-19: «элемент физически не может получать данные из соседних элементов или из ядра за исключением
// случаев когда невозможно никаким другим способом решить проблему и только по согласованию с архитектором».
//
// Почему хук, а не только правила: правила Read/Edit Claude Code действуют на его файловые инструменты и на узнаваемые команды
// оболочки (`cat`, `sed`, `head`), но не на «a Python or Node script that opens files itself» (code.claude.com/docs/en/permissions),
// а песочницы на Windows нет («On native Windows, Claude Code runs commands unsandboxed», …/sandboxing). Хук читает ТЕКСТ вызова:
// команду оболочки, путь и содержимое записываемого файла. Назван путь вне своей папки — ответ `ask`: Claude Code спрашивает
// человека в терминале (у разбуженного из Telegram — узел присылает ссылку, `bridge.cjs` → `watchAsk`). Решает архитектор.
// 🛑 Чего хук не ловит, и это сказано вслух: путь, собранный во время работы скрипта (склейка строк, вычисленный `..`).
//
// Своё: папка элемента, его данные `data/services/<id>`, `logs/runtime.json` ядра (адрес ядра), временные папки, кэши npm и то,
// что нужно самому Claude Code в `~/.claude` (кроме чужих журналов `~/.claude/projects`). Всё остальное под домом человека — чужое.
// Запуск: `node element-boundary-hook.mjs --dir <папка элемента> --data <его данные> --root <корень узла>`; вход — JSON хука в stdin.

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, resolve } from 'node:path'

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : '' }
const norm = (p) => String(p).replace(/\\/g, '/').replace(/^\/([a-z])\//i, '$1:/').replace(/\/+$/, '').toLowerCase()
const DIR = norm(arg('--dir'))
const DATA = norm(arg('--data'))
const ROOT = norm(arg('--root'))
const HOME = norm(homedir())

const OWN = [DIR, DATA, `${ROOT}/logs/runtime.json`, `${HOME}/appdata/local/temp`, `${HOME}/appdata/roaming/npm`,
  `${HOME}/appdata/local/npm-cache`, `${HOME}/.npm`, `${HOME}/.cache`, `${HOME}/.claude`].filter(Boolean)
const FOREIGN_INSIDE_OWN = [`${HOME}/.claude/projects`]

const under = (p, base) => p === base || p.startsWith(`${base}/`)
function outside(p) {
  if (!(under(p, HOME) || (ROOT && under(p, ROOT)))) return false
  if (FOREIGN_INSIDE_OWN.some((b) => under(p, b))) return true
  return !OWN.some((b) => under(p, b))
}

// Пути в тексте: `C:\…`, `C:/…`, `/c/…`, `~/…`, `$HOME/…`, `%USERPROFILE%\…` и относительные с `..`. Адреса `scheme://` — не пути.
function pathsIn(text, cwd) {
  const out = []
  const t = String(text ?? '')
  for (const m of t.matchAll(/(?<![\w:/])([a-zA-Z]:[\\/][^\s"'`|&;<>()]*)/g)) out.push(m[1])
  for (const m of t.matchAll(/(?<![\w:./-])(\/[a-zA-Z]\/[^\s"'`|&;<>()]*)/g)) out.push(m[1])
  for (const m of t.matchAll(/(?:~|\$HOME|\$\{HOME\}|%USERPROFILE%)([\\/][^\s"'`|&;<>()]*)/g)) out.push(HOME + m[1])
  for (const m of t.matchAll(/(?<![\w:/])((?:\.\.[\\/])+[^\s"'`|&;<>()]*|\.\.(?=$|[\s"'`|&;<>()]))/g)) out.push(resolve(cwd || DIR, m[1]))
  return out.map((p) => norm(isAbsolute(p) || /^[a-z]:/i.test(p) ? p : resolve(cwd || DIR, p)))
}

let input = {}
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}') } catch { process.exit(0) }
const tool = input.tool_name ?? ''
const ti = input.tool_input ?? {}
const cwd = input.cwd ?? DIR
const texts = tool === 'Bash' || tool === 'PowerShell' ? [ti.command]
  : [ti.file_path, ti.notebook_path, ti.content, ti.new_string, ...(Array.isArray(ti.edits) ? ti.edits.map((e) => e?.new_string) : [])]
const hit = [...new Set(texts.flatMap((x) => pathsIn(x, cwd)))].find(outside)
if (!hit) process.exit(0)

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'ask',
    permissionDecisionReason: `Outside your element's folder: ${hit}. Your boundary (CLAUDE.md, «Your boundary»): the architect decides.`,
  },
}))
