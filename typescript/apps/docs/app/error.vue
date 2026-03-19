<script setup lang="ts">
import type { NuxtError } from "#app";
import type { ContentNavigationItem, PageCollections } from "@nuxt/content";
import * as nuxtUiLocales from "@nuxt/ui/locale";
import { transformNavigation } from "./utils/navigation";

const props = defineProps<{
  error: NuxtError;
}>();

const { locale, t } = useDocusI18n();

const nuxtUiLocale = computed(
  () =>
    nuxtUiLocales[locale.value as keyof typeof nuxtUiLocales] ||
    nuxtUiLocales.en
);
const lang = computed(() => nuxtUiLocale.value.code);
const dir = computed(() => nuxtUiLocale.value.dir);

useHead({
  htmlAttrs: {
    lang,
    dir
  }
});

const localizedError = computed(() => ({
  ...props.error,
  statusMessage: t("common.error.title"),
  message: t("common.error.description")
}));

useSeoMeta({
  title: () => t("common.error.title"),
  description: () => t("common.error.description")
});

const { data: navigation } = await useAsyncData(
  "navigation_docs",
  () => queryCollectionNavigation("docs" as keyof PageCollections),
  {
    transform: (data: ContentNavigationItem[]) => transformNavigation(data)
  }
);
const { data: files } = useLazyAsyncData(
  "search_docs",
  () => queryCollectionSearchSections("docs" as keyof PageCollections),
  {
    server: false
  }
);

provide("navigation", navigation);
</script>

<template>
  <UApp :locale="nuxtUiLocale">
    <AppHeader />
    <UError :error="localizedError" />
    <AppFooter />

    <ClientOnly>
      <LazyUContentSearch :files="files" :navigation="navigation" />
    </ClientOnly>
  </UApp>
</template>
