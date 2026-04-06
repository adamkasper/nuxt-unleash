import { useRuntimeConfig } from 'nitropack/runtime'
import { getFlags, setFlags, isRefreshing, setRefreshing } from '#unleash/storage'
import type { CachedFlags, EvaluatedFlag } from '#unleash/types'

interface FrontendToggle {
  name: string
  enabled: boolean
  variant: {
    name: string
    enabled: boolean
    featureEnabled?: boolean
    payload?: { type: string; value: string }
  }
  impressionData?: boolean
}

export async function refreshUnleashFlags(options?: { force?: boolean }): Promise<CachedFlags | null> {
  const config = useRuntimeConfig().unleash

  if (!options?.force) {
    const refreshing = await isRefreshing()
    if (refreshing) {
      return await getFlags()
    }
  }

  await setRefreshing(true)

  try {
    const response = await $fetch<{ toggles: FrontendToggle[] }>(config.url, {
      headers: {
        'Authorization': config.token,
        'Accept': 'application/json',
      },
      timeout: 5000,
    })

    const toggles: Record<string, EvaluatedFlag> = {}
    for (const toggle of response.toggles) {
      toggles[toggle.name] = {
        name: toggle.name,
        enabled: toggle.enabled,
        variant: {
          name: toggle.variant.name,
          enabled: toggle.variant.enabled,
          payload: toggle.variant.payload,
        },
      }
    }

    const cached: CachedFlags = {
      toggles,
      lastUpdated: Date.now(),
    }

    await setFlags(cached)
    return cached
  }
  catch (error) {
    console.warn('[nuxt-unleash] Failed to fetch flags from proxy:', (error as Error).message)
    return await getFlags()
  }
  finally {
    await setRefreshing(false)
  }
}
