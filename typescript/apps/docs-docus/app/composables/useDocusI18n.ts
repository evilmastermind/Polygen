const messages = {
  common: {
    or: "or",
    error: {
      title: "Page not found",
      description: "The page you requested could not be found."
    }
  },
  docs: {
    toc: "On this page",
    links: "Project",
    menu: "Menu",
    edit: "Edit this page",
    report: "Report an issue",
    copy: {
      link: "Copy link"
    }
  }
} as const;

export const useDocusI18n = () => {
  const locale = ref("en");
  const isEnabled = ref(false);

  return {
    isEnabled,
    locale,
    locales: [],
    localePath: (path: string) => path,
    switchLocalePath: () => "/",
    t: (key: string): string => {
      return key.split(".").reduce((acc: unknown, curr) => {
        return (acc as Record<string, unknown>)?.[curr];
      }, messages) as string;
    }
  };
};