import "server-only"
import { readFile, statfs } from "node:fs/promises"
import os from "node:os"

// ПАРАМЕТРЫ ЭТОЙ МАШИНЫ ПРОТИВ ПРОФИЛЯ СУПЕР-УЗЛА (530-3). Профиль Tier-2 «Super-Relay» — документ Lagrix 14 §14.2: 8 vCPU с AES-NI,
// 16 ГБ ОЗУ, 500 ГБ NVMe, 1 Гбит/с без лимита, статический IPv4 и подсеть IPv6 /64.
//
// 🔒 ЧИСЛО О МАШИНЕ: страница спрашивает его в браузере (закон шага 264), сборка его не печатает.
// 🔒 ИЗМЕРЯЕТСЯ ТОЛЬКО ТО, ЧТО МАШИНА ЗНАЕТ О СЕБЕ: ядра, AES-NI (Linux — флаги процессора; на других системах «не измеряется»), память,
// размер и свободное место диска узла. Полоса, статический IPv4 и IPv6 отсюда не измеряются — так и говорится, а не угадывается.

export const TIER2 = { cpus: 8, ramGb: 16, diskGb: 500 } as const

export type MachineFacts = {
  platform: string
  cpus: number
  cpuModel: string
  aes: boolean | null
  ramGb: number
  diskTotalGb: number | null
  diskFreeGb: number | null
}

const gb = (bytes: number) => Math.round((bytes / 1024 ** 3) * 10) / 10

async function aesFlag(): Promise<boolean | null> {
  if (process.platform !== "linux") return null
  try {
    return /\baes\b/.test(await readFile("/proc/cpuinfo", "utf8"))
  } catch {
    return null
  }
}

export async function machineFacts(): Promise<MachineFacts> {
  const cpus = os.cpus()
  let diskTotalGb: number | null = null
  let diskFreeGb: number | null = null
  try {
    const s = await statfs(process.cwd())
    diskTotalGb = gb(s.blocks * s.bsize)
    diskFreeGb = gb(s.bavail * s.bsize)
  } catch { /* нет statfs — размер диска не измерен */ }
  return {
    platform: `${os.type()} ${os.release()} (${process.arch})`,
    cpus: cpus.length,
    cpuModel: cpus[0]?.model?.trim() ?? "",
    aes: await aesFlag(),
    ramGb: gb(os.totalmem()),
    diskTotalGb,
    diskFreeGb,
  }
}
