import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2026-03-16",
  modules: ["@nuxt/ui", "@nuxt/content", "@nuxtjs/robots"],
  routeRules: {
    "/": { prerender: true },
    "/docs": { redirect: "/docs/getting-started" }
  },
  site: {
    name: "Polygen Docs",
    url: "https://polygen.org"
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
      autoSubfolderIndex: false
    }
  },
  content: {
    experimental: { sqliteConnector: "native" },
    build: {
      markdown: {
        highlight: {
          langs: ["bash", "diff", "json", "js", "ts", "html", "css", "vue", "shell", "mdc", "md", "yaml"]
        },
        remarkPlugins: {
          "remark-mdc": {
            options: {
              autoUnwrap: true
            }
          }
        }
      }
    }
  },
  mdc: {
    highlight: {
      shikiEngine: "javascript"
    }
  },
  css: ["~/assets/css/main.css"],
  icon: {
    clientBundle: {
      scan: true
    },
    provider: "iconify"
  },
  robots: {
    groups: [
      {
        userAgent: "*",
        allow: "/"
      }
    ],
    sitemap: "/sitemap.xml"
  },
  runtimeConfig: {
    public: {
      locale: "en",
      version: "0.1.0"
    }
  },
  typescript: {
    strict: false
  },
  devtools: {
    enabled: false
  }
});