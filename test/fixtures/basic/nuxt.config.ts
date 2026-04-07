export default defineNuxtConfig({
  modules: ['../../../src/module'],
  compatibilityDate: '2026-04-06',

  unleash: {
    url: 'http://localhost:3737/api/frontend',
    token: 'test-token',
    appName: 'test-app',
    storage: 'memory',
    refreshInterval: 60_000,
    clientRefreshInterval: 0,
  },
})
