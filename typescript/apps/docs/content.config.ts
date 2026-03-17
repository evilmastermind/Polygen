import { defineCollection, defineContentConfig } from "@nuxt/content";

const contentConfig: ReturnType<typeof defineContentConfig> =
  defineContentConfig({
    collections: {
      content: defineCollection({
        type: "page",
        source: "**/*.md"
      })
    }
  });

export default contentConfig;
