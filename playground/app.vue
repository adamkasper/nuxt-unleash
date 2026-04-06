<template>
  <div style="font-family: sans-serif; max-width: 600px; margin: 40px auto;">
    <h1>nuxt-unleash v2 playground</h1>

    <section>
      <h2>Status</h2>
      <p>Ready: {{ ready }}</p>
      <p>Flag count: {{ flagCount }}</p>
    </section>

    <section>
      <h2>All flags</h2>
      <pre>{{ JSON.stringify(allFlags, null, 2) }}</pre>
    </section>

    <section>
      <h2>Test flag</h2>
      <p>my-feature: {{ myFeature }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
const myFeature = useFlag('my-feature')
const allFlags = useAllFlags()
const { ready, flagCount } = useFlagsStatus()
</script>
