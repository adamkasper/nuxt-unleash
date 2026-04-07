import type { CachedFlags } from '#unleash/types'
import { defineNuxtPlugin, useState } from '#app'

export default defineNuxtPlugin({
  name: 'unleash-server',
  async setup() {
    const data = await $fetch('/api/_unleash/flags')

    useState<CachedFlags>('unleash-flags', () => ({
      toggles: data.toggles,
      lastUpdated: data.lastUpdated,
    }))
  },
})
