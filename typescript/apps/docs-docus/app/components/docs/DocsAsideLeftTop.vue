<script setup lang="ts">
const { subNavigationMode, sections } = useSubNavigation();
</script>

<template>
  <div
    v-if="subNavigationMode === 'aside'"
    class="mb-2"
  >
    <UPageAnchors :links="sections" />
    <USeparator type="dashed" class="my-4" />
  </div>

  <div v-else />
</template>