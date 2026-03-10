import { InMemStorageProvider, startUnleash } from 'unleash-client'
import { setUnleashInstance } from './utils/unleash'

export default defineNitroPlugin((nitro) => {
  const config = useRuntimeConfig().unleash as {
    url: string
    token: string
    appName: string
    environment: string
    refreshInterval: number
    disableMetrics: boolean
  }

  // Non-blocking: server starts immediately, flags become available once SDK syncs
  startUnleash({
    url: config.url,
    appName: config.appName,
    customHeaders: { Authorization: config.token },
    refreshInterval: config.refreshInterval,
    disableMetrics: config.disableMetrics,
    environment: config.environment,
    storageProvider: new InMemStorageProvider(),
  }).then((instance) => {
    setUnleashInstance(instance)
    // eslint-disable-next-line no-console
    console.log('[nuxt-unleash] SDK initialized')

    nitro.hooks.hook('close', () => {
      instance.destroy()
    })
  }).catch((error) => {
    console.error('[nuxt-unleash] Failed to initialize SDK:', error)
  })
})
