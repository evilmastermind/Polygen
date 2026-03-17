<script setup lang="ts">
const route = useRoute();

const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection("content")
    .path(route.path === "/" ? "/index" : route.path)
    .first();
});
</script>

<template>
  <main>
    <ContentRenderer v-if="page" :value="page" />
    <div v-else>Page not found.</div>
  </main>
</template>
