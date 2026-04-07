export function getContents(storageKey: string): string {
  return `
import type { CachedFlags } from '#unleash/types'
import { useStorage } from 'nitro/storage'

function storage() {
  return useStorage('unleash')
}

export async function getFlags(): Promise<CachedFlags | null> {
  return await storage().getItem<CachedFlags>('${storageKey}') ?? null
}

export async function setFlags(flags: CachedFlags): Promise<void> {
  await storage().setItem('${storageKey}', flags)
}

export async function isRefreshing(): Promise<boolean> {
  const ts = await storage().getItem<number>('${storageKey}:refreshing')
  if (!ts) return false
  return Date.now() - ts < 5000
}

export async function setRefreshing(value: boolean): Promise<void> {
  if (value) {
    await storage().setItem('${storageKey}:refreshing', Date.now())
  } else {
    await storage().removeItem('${storageKey}:refreshing')
  }
}
`
}
