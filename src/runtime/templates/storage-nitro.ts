export function getContents(storageKey: string): string {
  const safeKey = JSON.stringify(storageKey)
  const safeRefreshingKey = JSON.stringify(`${storageKey}:refreshing`)
  return `
import type { CachedFlags } from '#unleash/types'
import { useStorage } from 'nitro/storage'

function storage() {
  return useStorage('unleash')
}

export async function getFlags(): Promise<CachedFlags | null> {
  return await storage().getItem<CachedFlags>(${safeKey}) ?? null
}

export async function setFlags(flags: CachedFlags): Promise<void> {
  await storage().setItem(${safeKey}, flags)
}

export async function isRefreshing(): Promise<boolean> {
  const ts = await storage().getItem<number>(${safeRefreshingKey})
  if (!ts) return false
  return Date.now() - ts < 5000
}

export async function setRefreshing(value: boolean): Promise<void> {
  if (value) {
    await storage().setItem(${safeRefreshingKey}, Date.now())
  } else {
    await storage().removeItem(${safeRefreshingKey})
  }
}
`
}
