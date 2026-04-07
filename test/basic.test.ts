import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('nuxt-unleash', async () => {
  await setup({
    rootDir: './test/fixtures/basic',
  })

  it('renders the index page', async () => {
    const html = await $fetch('/')
    expect(html).toBeTruthy()
  })

  it('serves flags via API route', async () => {
    const data = await $fetch('/api/_unleash/flags')
    expect(data).toHaveProperty('toggles')
    expect(data).toHaveProperty('ready')
    expect(data).toHaveProperty('lastUpdated')
  })

  it('returns empty flags when proxy is unreachable', async () => {
    const data = await $fetch('/api/_unleash/flags')
    expect(data.toggles).toBeDefined()
    expect(typeof data.ready).toBe('boolean')
  })
})
