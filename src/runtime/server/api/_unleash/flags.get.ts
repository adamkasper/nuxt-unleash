import { defineEventHandler } from 'h3'
import { useUnleashFlags } from '../../utils/useUnleashFlags'

export default defineEventHandler(async () => {
  const cached = await useUnleashFlags()
  return {
    toggles: cached.toggles,
    lastUpdated: cached.lastUpdated,
    ready: cached.lastUpdated > 0,
  }
})
