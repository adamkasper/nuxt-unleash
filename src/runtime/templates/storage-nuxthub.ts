export function getContents(storageKey: string, refreshInterval: number): string {
  const ttl = Math.ceil((Math.max(0, Number(refreshInterval) || 15_000) * 10) / 1000)
  const safeKey = JSON.stringify(storageKey)
  const safeRefreshingKey = JSON.stringify(`${storageKey}:refreshing`)
  return `
import type { CachedFlags } from '#unleash/types'
import { kv } from '@nuxthub/kv'

export async function getFlags(): Promise<CachedFlags | null> {
  return await kv.get(${safeKey}) ?? null
}

export async function setFlags(flags: CachedFlags): Promise<void> {
  await kv.set(${safeKey}, flags, { ttl: ${ttl} })
}

export async function isRefreshing(): Promise<boolean> {
  const ts = await kv.get<number>(${safeRefreshingKey})
  if (!ts) return false
  return Date.now() - ts < 5000
}

export async function setRefreshing(value: boolean): Promise<void> {
  if (value) {
    await kv.set(${safeRefreshingKey}, Date.now(), { ttl: 10 })
  } else {
    await kv.del(${safeRefreshingKey})
  }
}
`
}
