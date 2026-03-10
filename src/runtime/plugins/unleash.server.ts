import type { UnleashContext } from '../types'
import { defineNuxtPlugin, useRequestEvent } from '#imports'
import { getCookie, getRequestIP } from 'h3'
import { evaluateAllFlags, getUnleashInstance } from '../server/utils/unleash'
import { useUnleashContextState, useUnleashState } from '../state'

export default defineNuxtPlugin({
  name: 'nuxt-unleash:server',
  setup() {
    const flags = useUnleashState()
    const context = useUnleashContextState()

    const event = useRequestEvent()
    if (!event)
      return

    const instance = getUnleashInstance()
    if (!instance)
      return

    const ctx: UnleashContext = {
      userId: getCookie(event, 'unleash-userId'),
      sessionId: getCookie(event, 'unleash-sessionId'),
      remoteAddress: getRequestIP(event) || undefined,
    }

    context.value = ctx
    flags.value = evaluateAllFlags(instance, ctx)
  },
})
