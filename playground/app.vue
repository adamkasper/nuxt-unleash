<script setup lang="ts">
const myFeature = useFlag('my-feature')
const experimentVariant = useVariant('experiment')
const { ready, flagCount } = useFlagsStatus()
const { updateContext } = useUnleashContext()
const allFlags = useAllFlags()

async function login(userId: string) {
  await updateContext({ userId })
}
</script>

<template>
  <div style="font-family: system-ui; max-width: 640px; margin: 2rem auto; padding: 0 1rem;">
    <h1>Nuxt Unleash Playground</h1>

    <section>
      <h2>Status</h2>
      <p>Ready: <strong>{{ ready }}</strong></p>
      <p>Flags loaded: <strong>{{ flagCount }}</strong></p>
    </section>

    <section>
      <h2>Feature Flag: my-feature</h2>
      <p>Enabled: <strong :style="{ color: myFeature ? '#28a745' : '#dc3545' }">{{ myFeature }}</strong></p>
      <div v-if="myFeature" style="padding: 1rem; background: #d4edda; border-radius: 4px;">
        This content is only visible when "my-feature" is enabled.
      </div>
    </section>

    <section>
      <h2>Variant: experiment</h2>
      <p>Name: <code>{{ experimentVariant.name }}</code></p>
      <p>Enabled: <strong>{{ experimentVariant.enabled }}</strong></p>
      <pre v-if="experimentVariant.payload" style="background: #f8f9fa; padding: 0.75rem; border-radius: 4px;">{{ experimentVariant.payload }}</pre>
    </section>

    <section>
      <h2>Context</h2>
      <p>Re-evaluate flags with user context:</p>
      <button @click="login('user-123')">
        Login as user-123
      </button>
      <button style="margin-left: 0.5rem;" @click="login('user-456')">
        Login as user-456
      </button>
    </section>

    <section>
      <h2>All Flags</h2>
      <pre style="background: #f8f9fa; padding: 0.75rem; border-radius: 4px; overflow-x: auto;">{{ JSON.stringify(allFlags, null, 2) }}</pre>
    </section>
  </div>
</template>
