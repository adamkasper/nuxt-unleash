export default defineNuxtConfig({
  site: {
    name: 'nuxt-unleash',
  },
  content: {
    experimental: {
      sqliteConnector: 'native',
    },
  },
})
