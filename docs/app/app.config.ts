export default defineAppConfig({
  seo: {
    titleTemplate: '%s - nuxt-unleash',
    title: 'nuxt-unleash',
    description: 'Edge-first Unleash feature flags for Nuxt',
  },
  header: {
    title: 'nuxt-unleash',
  },
  socials: {
    github: 'https://github.com/adamkasper/nuxt-unleash',
  },
  github: {
    url: 'https://github.com/adamkasper/nuxt-unleash',
    branch: 'main',
    rootDir: 'docs',
  },
  toc: {
    title: 'On this page',
  },
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate',
    },
  },
})
