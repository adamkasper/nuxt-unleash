import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import { fetchFlags, useUnleashContextState, useUnleashState } from '../state'

export default defineNuxtPlugin({
  name: 'nuxt-unleash:client',
  setup(nuxtApp) {
    const flags = useUnleashState()
    const context = useUnleashContextState()
    const config = useRuntimeConfig().public.unleash

    if (!config.clientRefreshInterval || config.clientRefreshInterval <= 0)
      return

    let timer: ReturnType<typeof setInterval> | null = null

    async function refresh() {
      try {
        flags.value = await fetchFlags(context.value)
      }
      catch {
        // SSR state remains valid until next successful refresh
      }
    }

    function startPolling() {
      if (timer)
        clearInterval(timer)
      timer = setInterval(refresh, config.clientRefreshInterval)
    }

    function stopPolling() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    nuxtApp.hook('app:mounted', () => {
      startPolling()

      // Pause polling when tab is hidden
      document.addEventListener('visibilitychange', () => {
        if (document.hidden)
          stopPolling()
        else
          startPolling()
      })
    })

    if (import.meta.hot) {
      import.meta.hot.dispose(stopPolling)
    }
  },
})
