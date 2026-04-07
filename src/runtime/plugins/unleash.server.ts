import { defineNuxtPlugin, useState } from '#app'
import type { CachedFlags } from '#unleash/types'

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
