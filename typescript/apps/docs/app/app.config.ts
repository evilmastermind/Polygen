export default defineAppConfig({
  docus: {
    locale: "en"
  },
  ui: {
    colors: {
      primary: "olive",
      neutral: "slate"
    }
  },
  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            // Default theme (same as single string)
            default: "github-light",
            // Theme used if `html.dark`
            dark: "github-dark",
            // Theme used if `html.sepia`
            sepia: "monokai"
          }
        }
      }
    }
  },
  theme: {
    radius: 0.4
  },
  seo: {
    title: "Polygen"
  },
  header: {
    logo: {
      light: "/thumbnail.svg",
      dark: "/thumbnail.svg",
      alt: "Polygen"
    }
  },
  github: {
    url: "https://github.com/alvisespano/Polygen",
    branch: "develop",
    rootDir: "typescript/apps/docs-docus"
  },
  toc: {
    title: "On this page",
    bottom: {
      edit: "https://github.com/pdonadeo/Polygen/edit/develop/typescript/apps/docs-docus/content/docs",
      title: "Project",
      links: [
        {
          icon: "i-simple-icons-github",
          label: "Original repository",
          to: "https://github.com/alvisespano/Polygen",
          target: "_blank"
        },
        {
          icon: "i-lucide-scroll-text",
          label: "Historical spec",
          to: "https://polygen.org",
          target: "_blank"
        }
      ]
    }
  }
});
