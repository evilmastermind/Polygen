import type { ContentNavigationItem } from "@nuxt/content";

export const flattenNavigation = (
  items?: ContentNavigationItem[]
): ContentNavigationItem[] =>
  items?.flatMap((item) =>
    item.children ? flattenNavigation(item.children) : [item]
  ) || [];

export function transformNavigation(
  data: ContentNavigationItem[]
): ContentNavigationItem[] {
  return data.find((item) => item.path === "/docs")?.children || data;
}

export interface BreadcrumbItem {
  title: string;
  path: string;
}

export function findPageBreadcrumbs(
  navigation: ContentNavigationItem[] | undefined,
  path: string,
  currentPath: BreadcrumbItem[] = []
): BreadcrumbItem[] | undefined {
  if (!navigation) return undefined;

  for (const item of navigation) {
    const itemPath = [...currentPath, { title: item.title, path: item.path }];
    if (item.path === path) {
      return itemPath;
    }
    if (item.children) {
      const found = findPageBreadcrumbs(item.children, path, itemPath);
      if (found) return found;
    }
  }

  return undefined;
}
