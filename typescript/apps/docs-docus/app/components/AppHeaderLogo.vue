<script setup lang="ts">
const appConfig = useAppConfig();
const config = useRuntimeConfig();
</script>

<template>
  <div class="flex items-center gap-2">
    <NuxtLink to="/" class="flex items-center gap-3">
      <UColorModeImage
        :light="appConfig.header?.logo?.light"
        :dark="appConfig.header?.logo?.dark"
        :alt="appConfig.header?.logo?.alt"
        class="h-7 w-auto shrink-0"
      />
      <span class="hidden font-semibold tracking-wide text-sm sm:inline">
        Polygen Docs
      </span>
    </NuxtLink>

    <UBadge color="primary" variant="subtle" class="rounded-full">
      v{{ config.public.version }}
    </UBadge>
  </div>
</template>
