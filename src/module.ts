import { defineNuxtModule, addPlugin, addServerPlugin, createResolver, addImportsDir, addServerImportsDir, addTemplate, hasNuxtModule, addServerHandler } from '@nuxt/kit'
import { defu } from 'defu'
import type { UnleashModuleOptions } from './runtime/types'
import { registerTypeTemplates } from './type-templates'
import { getContents as memoryContents } from './runtime/templates/storage-memory'
import { getContents as nitroContents } from './runtime/templates/storage-nitro'
import { getContents as nuxthubContents } from './runtime/templates/storage-nuxthub'

export type { UnleashModuleOptions }

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
      storageKey: string
    }
  }
}

export default defineNuxtModule<UnleashModuleOptions>({
  meta: {
    name: 'nuxt-unleash',
    configKey: 'unleash',
  },
  defaults: {
    url: '',
    token: '',
    appName: '',
    environment: 'default',
    refreshInterval: 15_000,
    clientRefreshInterval: 30_000,
    storage: 'memory',
    storageKey: 'unleash:flags',
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    if (!options.url || !options.token || !options.appName) {
      console.warn('[nuxt-unleash] Missing required config (url, token, appName). Module disabled.')
      return
    }

    // Storage validation
    if (options.storage === 'nuxthub') {
      const hasNuxtHub = hasNuxtModule('@nuxthub/core', nuxt)
      if (!hasNuxtHub) {
        throw new Error('[nuxt-unleash] storage: "nuxthub" requires @nuxthub/core module. Install it and add it to modules before nuxt-unleash.')
      }
      const hubConfig = (nuxt.options as any).hub
      if (!hubConfig?.kv) {
        throw new Error('[nuxt-unleash] storage: "nuxthub" requires hub.kv: true in your nuxt.config.')
      }
      if (!nuxt.options.alias['hub:kv']) {
        throw new Error('[nuxt-unleash] @nuxthub/core must be listed before nuxt-unleash in modules array.')
      }
    }

    if (options.storage === 'nitro') {
      const hasUnleashStorage = !!(nuxt.options.nitro as any)?.storage?.unleash
      if (!hasUnleashStorage) {
        console.warn('[nuxt-unleash] storage: "nitro" but nitro.storage.unleash is not configured. Falling back to memory.')
        options.storage = 'memory'
      }
    }

    // Runtime config
    nuxt.options.runtimeConfig.unleash = defu(
      nuxt.options.runtimeConfig.unleash,
      {
        url: options.url,
        token: options.token,
        appName: options.appName,
        environment: options.environment!,
        refreshInterval: options.refreshInterval!,
        storageKey: options.storageKey!,
      },
    )

    nuxt.options.runtimeConfig.public.unleash = defu(
      nuxt.options.runtimeConfig.public.unleash as any,
      {
        appName: options.appName,
        environment: options.environment!,
        clientRefreshInterval: options.clientRefreshInterval!,
      },
    )

    // Storage template
    const storageTemplate = addTemplate({
      filename: 'unleash/storage.ts',
      write: true,
      getContents: () => {
        switch (options.storage) {
          case 'nuxthub':
            return nuxthubContents(options.storageKey!, options.refreshInterval!)
          case 'nitro':
            return nitroContents(options.storageKey!)
          default:
            return memoryContents()
        }
      },
    })
    nuxt.options.alias['#unleash/storage'] = storageTemplate.dst

    // Type templates
    registerTypeTemplates()

    // Plugins
    addServerPlugin(resolver.resolve('./runtime/server/nitro-plugin'))
    addPlugin(resolver.resolve('./runtime/plugins/unleash.server'))
    addPlugin(resolver.resolve('./runtime/plugins/unleash.client'))

    // Auto-imports
    addImportsDir(resolver.resolve('./runtime/composables'))
    addServerImportsDir(resolver.resolve('./runtime/server/utils'))

    // API route
    addServerHandler({
      route: '/api/_unleash/flags',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/_unleash/flags.get'),
    })
  },
})
