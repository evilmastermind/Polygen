<script setup lang="ts">
const appConfig = useAppConfig();

interface FooterLink {
  icon: string;
  to: string;
  target: "_blank";
  "aria-label": string;
}

const links = computed<FooterLink[]>(() => {
  const githubLink = appConfig.github?.url
    ? [
        {
          icon: "i-simple-icons-github",
          to: appConfig.github.url,
          target: "_blank" as const,
          "aria-label": "GitHub repository"
        }
      ]
    : [];

  return githubLink;
});
</script>

<template>
  <template v-if="links.length">
    <UButton
      v-for="(link, index) of links"
      :key="index"
      size="sm"
      v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
    />
  </template>
  <UColorModeButton />
</template>