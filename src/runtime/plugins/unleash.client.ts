import { defineNuxtPlugin, useState, useRuntimeConfig } from '#app'
import type { CachedFlags } from '#unleash/types'

export default defineNuxtPlugin({
  name: 'unleash-client',
  setup() {
    const config = useRuntimeConfig().public.unleash
    const state = useState<CachedFlags>('unleash-flags')

    if (!config.clientRefreshInterval || config.clientRefreshInterval <= 0) {
      return
    }

    let intervalId: ReturnType<typeof setInterval> | null = null

    const startPolling = () => {
      if (intervalId) return
      intervalId = setInterval(async () => {
        try {
          const data = await $fetch('/api/_unleash/flags')
          if (data && data.toggles) {
            state.value = {
              toggles: data.toggles,
              lastUpdated: data.lastUpdated,
            }
          }
        }
        catch {
          // Silently ignore polling errors — flags stay at current value
        }
      }, config.clientRefreshInterval)
    }

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    // Pause polling when tab is hidden
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          stopPolling()
        }
        else {
          startPolling()
        }
      })
    }

    startPolling()
  },
})
