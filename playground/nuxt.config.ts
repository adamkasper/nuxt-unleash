export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',

  unleash: {
    url: 'https://unleash.example.com/api',
    token: 'default:development.your-token-here',
    appName: 'nuxt-unleash-playground',
    environment: 'development',
    refreshInterval: 15000,
    clientRefreshInterval: 30000,
  },
})
