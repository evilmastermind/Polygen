<script setup lang="ts">
import type { ContentNavigationItem, PageCollections } from "@nuxt/content";
import * as nuxtUiLocales from "@nuxt/ui/locale";
import { transformNavigation } from "./utils/navigation";
import { useSubNavigation } from "./composables/useSubNavigation";

const { seo } = useAppConfig();
const site = useSiteConfig();
const { locale } = useDocusI18n();

const nuxtUiLocale = computed(
  () =>
    nuxtUiLocales[locale.value as keyof typeof nuxtUiLocales] ||
    nuxtUiLocales.en
);
const lang = computed(() => nuxtUiLocale.value.code);
const dir = computed(() => nuxtUiLocale.value.dir);
const collectionName = computed(() => "docs");

useHead({
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
  link: [{ rel: "icon", href: "/favicon.ico" }],
  htmlAttrs: {
    lang,
    dir
  }
});

useSeoMeta({
  titleTemplate: seo.titleTemplate,
  title: seo.title,
  description: seo.description,
  ogSiteName: site.name,
  twitterCard: "summary_large_image"
});

const { data: navigation } = await useAsyncData(
  () => `navigation_${collectionName.value}`,
  () =>
    queryCollectionNavigation(collectionName.value as keyof PageCollections),
  {
    transform: (data: ContentNavigationItem[]) => transformNavigation(data)
  }
);

const { data: files } = useLazyAsyncData(
  `search_${collectionName.value}`,
  () =>
    queryCollectionSearchSections(
      collectionName.value as keyof PageCollections
    ),
  {
    server: false
  }
);

provide("navigation", navigation);

const { subNavigationMode } = useSubNavigation(navigation);
</script>

<template>
  <UApp :locale="nuxtUiLocale">
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <div :class="[{ 'docus-sub-header': subNavigationMode === 'header' }]">
      <AppHeader v-if="$route.meta.header !== false" />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <AppFooter v-if="$route.meta.footer !== false" />
    </div>

    <ClientOnly>
      <LazyUContentSearch :files="files" :navigation="navigation" />
    </ClientOnly>
  </UApp>
</template>

<style>
@media (min-width: 1024px) {
  .docus-sub-header {
    --ui-header-height: 112px;
  }
}
</style>
