<script setup lang="ts">
const route = useRoute();
const toast = useToast();
const { t } = useDocusI18n();
const copied = ref(false);

async function copyLink() {
  if (typeof window === "undefined" || !navigator.clipboard) {
    return;
  }

  await navigator.clipboard.writeText(`${window.location.origin}${route.path}`);
  copied.value = true;
  toast.add({
    title: "Copied link",
    icon: "i-lucide-check-circle"
  });

  window.setTimeout(() => {
    copied.value = false;
  }, 1500);
}
</script>

<template>
  <UButton
    :label="t('docs.copy.link')"
    :icon="copied ? 'i-lucide-check' : 'i-lucide-link'"
    color="neutral"
    variant="soft"
    size="sm"
    @click="copyLink"
  />
</template>
