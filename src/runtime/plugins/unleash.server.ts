import { defineNuxtPlugin, useState } from '#app'
import { useUnleashFlags } from '../server/utils/useUnleashFlags'
import type { CachedFlags } from '#unleash/types'

export default defineNuxtPlugin({
  name: 'unleash-server',
  async setup() {
    const cached = await useUnleashFlags()

    useState<CachedFlags>('unleash-flags', () => cached)
  },
})
