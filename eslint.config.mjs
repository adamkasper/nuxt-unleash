import antfu from '@antfu/eslint-config'
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: true,
    standalone: false,
  },
  dirs: {
    src: [
      './playground',
    ],
  },
}).append(antfu({
  pnpm: {
    yaml: false,
    catalogs: true,
  },
}))
