import {
  addImportsDir,
  addPlugin,
  addServerHandler,
  addServerPlugin,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit'
import { defu } from 'defu'

export interface ModuleOptions {
  /** Unleash API URL (e.g. https://unleash.example.com/api) */
  url: string
  /** Server-side API token */
  token: string
  /** Application name */
  appName: string
  /** Environment name (default: 'default') */
  environment?: string
  /** SDK refresh interval in milliseconds (default: 15000) */
  refreshInterval?: number
  /** Disable usage metrics (default: false) */
  disableMetrics?: boolean
  /** Client-side refresh interval in milliseconds, 0 to disable (default: 30000) */
  clientRefreshInterval?: number
}

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    unleash: {
      appName: string
      environment: string
      clientRefreshInterval: number
    }
  }
  interface RuntimeConfig {
    unleash: {
      url: string
      token: string
      appName: string
      environment: string
      refreshInterval: number
      disableMetrics: boolean
    }
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@adamkasper/nuxt-unleash',
    configKey: 'unleash',
    compatibility: { nuxt: '>=4.0.0' },
  },
  defaults: {
    url: '',
    token: '',
    appName: '',
    environment: 'default',
    refreshInterval: 15000,
    disableMetrics: false,
    clientRefreshInterval: 30000,
  },
  setup(options, nuxt) {
    if (!options.url || !options.token || !options.appName) {
      console.warn('[nuxt-unleash] Missing required options: url, token, appName')
      return
    }

    const { resolve } = createResolver(import.meta.url)

    // Private runtime config (server-only) — supports NUXT_UNLEASH_* env overrides
    nuxt.options.runtimeConfig.unleash = defu(
      nuxt.options.runtimeConfig.unleash as Record<string, unknown> | undefined,
      {
        url: options.url,
        token: options.token,
        appName: options.appName,
        environment: options.environment || 'default',
        refreshInterval: options.refreshInterval || 15000,
        disableMetrics: options.disableMetrics || false,
      },
    )

    // Public runtime config (client + server) — no secrets
    nuxt.options.runtimeConfig.public.unleash = defu(
      nuxt.options.runtimeConfig.public.unleash as Record<string, unknown> | undefined,
      {
        appName: options.appName,
        environment: options.environment || 'default',
        clientRefreshInterval: options.clientRefreshInterval || 30000,
      },
    )

    // Server: Nitro plugin to initialize SDK on startup
    addServerPlugin(resolve('./runtime/server/nitro-plugin'))

    // Server: API route to evaluate flags
    addServerHandler({
      route: '/api/_unleash/evaluate',
      handler: resolve('./runtime/server/api/evaluate.get'),
    })

    // Plugins: SSR evaluation + client hydration/refresh
    addPlugin({
      src: resolve('./runtime/plugins/unleash.server'),
      mode: 'server',
    })
    addPlugin({
      src: resolve('./runtime/plugins/unleash.client'),
      mode: 'client',
    })

    // Auto-import composables
    addImportsDir(resolve('./runtime/composables'))
  },
})
