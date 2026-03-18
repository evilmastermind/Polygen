import { defineCollection, defineContentConfig, z } from "@nuxt/content";

const createDocsSchema = () =>
  z.object({
    links: z
      .array(
        z.object({
          label: z.string(),
          icon: z.string(),
          to: z.string(),
          target: z.string().optional()
        })
      )
      .optional()
  });

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: "page",
      source: {
        include: "docs/**",
        prefix: "/docs",
        exclude: ["index.md"]
      },
      schema: createDocsSchema()
    }),
    landing: defineCollection({
      type: "page",
      source: "index.md"
    })
  }
});