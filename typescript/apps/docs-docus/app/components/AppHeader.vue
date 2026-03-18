<script setup lang="ts">
const route = useRoute();
const navigation = await queryCollectionNavigation("docs");

const docsNavigation = computed(() => navigation.value.at(0)?.children ?? []);
const links = computed(() => [
  {
    label: "Docs",
    to: "/docs/getting-started",
    icon: "i-lucide-book-open",
    active: route.path.startsWith("/docs")
  }
]);
</script>

<template>
  <UHeader :ui="{ left: 'min-w-0' }" class="flex flex-col">
    <template #left>
      <AppHeaderLogo />
    </template>

    <UNavigationMenu :items="links" variant="link" />

    <template #right>
      <UTooltip text="Search" :kbds="['meta', 'K']">
        <UContentSearchButton />
      </UTooltip>

      <UColorModeButton class="hidden sm:flex" />

      <UTooltip text="Open on GitHub" class="flex">
        <UButton
          color="neutral"
          variant="ghost"
          to="https://github.com/alvisespano/Polygen"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
        />
      </UTooltip>
    </template>

    <template #body>
      <UContentNavigation
        :navigation="docsNavigation"
        highlight
        :ui="{ linkTrailingBadge: 'font-semibold uppercase' }"
      />
    </template>
  </UHeader>
</template>
