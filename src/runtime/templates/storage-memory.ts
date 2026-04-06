export function getContents(): string {
  return `
import type { CachedFlags } from '#unleash/types'

const store = new Map<string, any>()

export async function getFlags(): Promise<CachedFlags | null> {
  return store.get('flags') ?? null
}

export async function setFlags(flags: CachedFlags): Promise<void> {
  store.set('flags', flags)
}

export async function isRefreshing(): Promise<boolean> {
  const ts = store.get('refreshing') as number | undefined
  if (!ts) return false
  return Date.now() - ts < 5000
}

export async function setRefreshing(value: boolean): Promise<void> {
  if (value) {
    store.set('refreshing', Date.now())
  } else {
    store.delete('refreshing')
  }
}
`
}
