<script setup lang="ts">
const navigation = [
  { description: "What Polygen is and why this rewrite exists.", to: "/" },
  {
    description: "Install the package and generate your first sentence.",
    to: "/quick-start"
  },
  {
    description: "Top-level helpers, lower-level APIs, and result metadata.",
    to: "/api"
  },
  {
    description: "Core grammar syntax used by the current TypeScript port.",
    to: "/grammar-basics"
  },
  {
    description: "Operator-by-operator reference for sentence shaping.",
    to: "/operators"
  },
  {
    description: "How labels, selection, and nested scopes behave.",
    to: "/labels-scoping"
  },
  {
    description:
      "Worked examples based on the same legacy fixtures used in tests.",
    to: "/examples"
  },
  {
    description:
      "What matches the legacy project today, what changed intentionally, and what is still deferred.",
    to: "/status-compatibility"
  },
  {
    description: "Deterministic seeds, entropy-backed runs, and replayability.",
    to: "/randomness"
  },
  {
    description: "Common compile and runtime failures and how to read them.",
    to: "/troubleshooting"
  }
] as const;

const route = useRoute();
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <NuxtLink class="brand" to="/">
        <span class="brand__eyebrow">Polygen</span>
        <strong>TypeScript Rewrite</strong>
      </NuxtLink>

      <p class="sidebar__intro">
        Browser-safe sentence generation with reproducible seeds and a grammar
        language ported from the original OCaml project.
      </p>

      <nav class="nav">
        <NuxtLink
          v-for="entry in navigation"
          :key="entry.to"
          :class="[
            'nav__item',
            { 'nav__item--active': route.path === entry.to }
          ]"
          :to="entry.to"
        >
          <span>{{
            entry.to === "/" ? "Overview" : entry.to.slice(1).replace("-", " ")
          }}</span>
          <small>{{ entry.description }}</small>
        </NuxtLink>
      </nav>
    </aside>

    <div class="content">
      <NuxtPage />
    </div>
  </div>
</template>

<style>
:root {
  --bg: #f6f1e8;
  --surface: rgba(255, 251, 246, 0.88);
  --surface-strong: rgba(255, 248, 241, 0.96);
  --text: #24170d;
  --muted: #6a5443;
  --line: rgba(88, 55, 24, 0.15);
  --accent: #b2542e;
  --accent-soft: rgba(178, 84, 46, 0.12);
  --shadow: 0 28px 80px rgba(69, 38, 13, 0.12);
}

* {
  box-sizing: border-box;
}

html {
  background:
    radial-gradient(
      circle at top left,
      rgba(242, 195, 112, 0.32),
      transparent 30%
    ),
    radial-gradient(
      circle at bottom right,
      rgba(181, 92, 49, 0.18),
      transparent 26%
    ),
    var(--bg);
  color: var(--text);
  font-family: "IBM Plex Sans", "Avenir Next", sans-serif;
}

body {
  margin: 0;
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

pre,
code {
  font-family: "IBM Plex Mono", "Fira Code", monospace;
}

.shell {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  height: 100vh;
  padding: 2rem 1.25rem;
  background: rgba(255, 250, 244, 0.7);
  border-right: 1px solid var(--line);
  backdrop-filter: blur(18px);
}

.brand {
  display: grid;
  gap: 0.2rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 1.1rem;
  background: linear-gradient(
    180deg,
    rgba(255, 250, 244, 0.95),
    rgba(255, 245, 235, 0.85)
  );
  box-shadow: var(--shadow);
}

.brand__eyebrow {
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}

.sidebar__intro {
  margin: 0;
  padding: 0 0.2rem;
  color: var(--muted);
  line-height: 1.55;
}

.nav {
  display: grid;
  gap: 0.7rem;
}

.nav__item {
  display: grid;
  gap: 0.28rem;
  padding: 0.95rem 1rem;
  border-radius: 1rem;
  border: 1px solid transparent;
  color: var(--muted);
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease;
}

.nav__item span {
  font-weight: 600;
  color: var(--text);
}

.nav__item small {
  line-height: 1.45;
}

.nav__item:hover,
.nav__item--active {
  transform: translateX(4px);
  border-color: var(--line);
  background: var(--accent-soft);
  color: var(--text);
}

.content {
  min-width: 0;
}

@media (max-width: 960px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
}
</style>
