export default defineNuxtConfig({
  modules: ['../src/module'],

  devtools: { enabled: true },
  compatibilityDate: '2026-04-06',

  unleash: {
    url: 'https://your-proxy.example.com/api/frontend',
    token: 'your-frontend-token',
    appName: 'playground',
    storage: 'memory',
    refreshInterval: 15_000,
    clientRefreshInterval: 30_000,
  },
})
