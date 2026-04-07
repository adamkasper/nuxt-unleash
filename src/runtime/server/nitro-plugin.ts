import { defineNitroPlugin } from 'nitropack/runtime'
import { refreshUnleashFlags } from './utils/refreshUnleashFlags'

export default defineNitroPlugin(async () => {
  try {
    await refreshUnleashFlags({ force: true })
    console.log('[nuxt-unleash] Flags loaded on startup')
  }
  catch (error) {
    console.warn('[nuxt-unleash] Failed to load flags on startup:', (error as Error).message)
  }
})
