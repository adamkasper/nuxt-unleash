import type { UnleashContext } from '../../types'
import { evaluateAllFlags, getUnleashInstance } from '../utils/unleash'

export default defineEventHandler((event) => {
  const instance = getUnleashInstance()
  if (!instance) {
    throw createError({ statusCode: 503, message: 'Unleash not ready' })
  }

  const query = getQuery(event)

  let properties: Record<string, string> | undefined
  if (query.properties) {
    try {
      properties = JSON.parse(query.properties as string)
    }
    catch {
      throw createError({ statusCode: 400, message: 'Invalid properties JSON' })
    }
  }

  const context: UnleashContext = {
    userId: query.userId as string | undefined,
    sessionId: query.sessionId as string | undefined,
    remoteAddress: getRequestIP(event) || undefined,
    properties,
  }

  return evaluateAllFlags(instance, context)
})
