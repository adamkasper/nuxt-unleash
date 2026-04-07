import type { CachedFlags } from '#unleash/types'
import { getFlags } from '#unleash/storage'
import { useRuntimeConfig } from 'nitropack/runtime'
import { refreshUnleashFlags } from './refreshUnleashFlags'

export async function useUnleashFlags(): Promise<CachedFlags> {
  const config = useRuntimeConfig().unleash
  const cached = await getFlags()

  if (!cached) {
    const fresh = await refreshUnleashFlags({ force: true })
    return fresh ?? { toggles: {}, lastUpdated: 0 }
  }

  const age = Date.now() - cached.lastUpdated
  if (age > config.refreshInterval) {
    refreshUnleashFlags().catch((err) => {
      console.warn('[nuxt-unleash] Background refresh failed:', err)
    })
  }

  return cached
}
