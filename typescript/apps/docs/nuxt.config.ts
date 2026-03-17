import { defineNuxtConfig } from "nuxt/config";

const isDev = process.env.NODE_ENV !== "production";

const nuxtConfig: ReturnType<typeof defineNuxtConfig> = defineNuxtConfig({
  compatibilityDate: "2026-03-16",
  // @ts-expect-error Nuxt Content augments Nuxt config at runtime, but the editor type here does not pick it up.
  content: {
    experimental: {
      sqliteConnector: isDev ? "native" : "better-sqlite3"
    },
    database: {
      type: "sqlite",
      filename: isDev ? "./.nuxt/content.db" : ":memory:"
    }
  },
  devtools: {
    enabled: true
  },
  modules: ["@nuxt/content"]
});

export default nuxtConfig;
