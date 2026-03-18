import type { MaybeRefOrGetter } from "vue";
import type { BreadcrumbItem } from "../utils/navigation";
import { joinURL, withoutTrailingSlash } from "ufo";

export interface UseSeoOptions {
  title: MaybeRefOrGetter<string | undefined>;
  description: MaybeRefOrGetter<string | undefined>;
  type?: MaybeRefOrGetter<"website" | "article">;
  publishedAt?: MaybeRefOrGetter<string | undefined>;
  modifiedAt?: MaybeRefOrGetter<string | undefined>;
  breadcrumbs?: MaybeRefOrGetter<BreadcrumbItem[] | undefined>;
}

export function useSeo(options: UseSeoOptions) {
  const route = useRoute();
  const site = useSiteConfig();

  const title = computed(() => toValue(options.title));
  const description = computed(() => toValue(options.description));
  const type = computed(() => toValue(options.type) || "article");
  const publishedAt = computed(() => toValue(options.publishedAt));
  const modifiedAt = computed(() => toValue(options.modifiedAt));
  const breadcrumbs = computed(() => toValue(options.breadcrumbs));

  const canonicalUrl = computed(() => {
    if (!site.url) return undefined;
    return joinURL(site.url, route.path);
  });

  const baseUrl = computed(() =>
    site.url ? withoutTrailingSlash(site.url) : ""
  );

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: type,
    ogUrl: canonicalUrl,
    twitterCard: "summary"
  });

  useHead({
    link: computed(() => {
      if (!canonicalUrl.value) {
        return [];
      }

      return [{ rel: "canonical", href: canonicalUrl.value }];
    })
  });

  useHead({
    script: computed(() => {
      const scripts: Array<{ type: string; innerHTML: string }> = [];

      if (!baseUrl.value || !title.value) {
        return scripts;
      }

      const pageUrl = joinURL(baseUrl.value, route.path);

      if (type.value === "article") {
        const articleSchema: Record<string, unknown> = {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title.value,
          description: description.value,
          url: pageUrl,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": pageUrl
          }
        };

        if (publishedAt.value) articleSchema.datePublished = publishedAt.value;
        if (modifiedAt.value) articleSchema.dateModified = modifiedAt.value;
        if (site.name) {
          articleSchema.publisher = {
            "@type": "Organization",
            name: site.name
          };
        }

        scripts.push({
          type: "application/ld+json",
          innerHTML: JSON.stringify(articleSchema)
        });
      }

      if (type.value === "website") {
        scripts.push({
          type: "application/ld+json",
          innerHTML: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: site.name || title.value,
            description: description.value,
            url: baseUrl.value
          })
        });
      }

      if (breadcrumbs.value?.length) {
        scripts.push({
          type: "application/ld+json",
          innerHTML: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbs.value.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.title,
              item: joinURL(baseUrl.value, item.path)
            }))
          })
        });
      }

      return scripts;
    })
  });
}
