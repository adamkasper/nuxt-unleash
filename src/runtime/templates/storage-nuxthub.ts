export function getContents(storageKey: string, refreshInterval: number): string {
  const ttl = Math.ceil((refreshInterval * 3) / 1000)
  return `
import type { CachedFlags } from '#unleash/types'
import { kv } from '@nuxthub/kv'

export async function getFlags(): Promise<CachedFlags | null> {
  return await kv.get('${storageKey}') ?? null
}

export async function setFlags(flags: CachedFlags): Promise<void> {
  await kv.set('${storageKey}', flags, { ttl: ${ttl} })
}

export async function isRefreshing(): Promise<boolean> {
  const ts = await kv.get<number>('${storageKey}:refreshing')
  if (!ts) return false
  return Date.now() - ts < 5000
}

export async function setRefreshing(value: boolean): Promise<void> {
  if (value) {
    await kv.set('${storageKey}:refreshing', Date.now(), { ttl: 10 })
  } else {
    await kv.del('${storageKey}:refreshing')
  }
}
`
}
