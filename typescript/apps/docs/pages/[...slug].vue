<script setup lang="ts">
const route = useRoute();

const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection("content")
    .path(route.path === "/" ? "/index" : route.path)
    .first();
});

watchEffect(() => {
  if (page.value?.title !== undefined) {
    useHead({
      title: `${page.value.title} | Polygen`
    });
  }
});
</script>

<template>
  <main class="page-shell">
    <template v-if="page">
      <ContentRenderer :value="page" />

      <footer class="credit-card">
        <p class="credit-card__eyebrow">AI development notice</p>
        <p>
          This TypeScript rewrite and its documentation are being actively
          developed with AI assistance.
        </p>

        <p class="credit-card__eyebrow">Original project credit</p>
        <p>
          This TypeScript rewrite builds on the original Polygen project created
          by Alvise Spano and the original contributors.
        </p>
        <p>
          Original website:
          <a href="https://polygen.org" rel="noreferrer" target="_blank">
            polygen.org
          </a>
        </p>
        <p>
          Original repository:
          <a
            href="https://github.com/alvisespano/Polygen"
            rel="noreferrer"
            target="_blank"
          >
            github.com/alvisespano/Polygen
          </a>
        </p>
      </footer>
    </template>
    <div v-else class="missing">Page not found.</div>
  </main>
</template>

<style scoped>
.page-shell {
  width: min(860px, calc(100vw - 3rem));
  margin: 0 auto;
  padding: 3rem 0 5rem;
}

.missing {
  padding: 2rem;
  border: 1px solid rgba(88, 55, 24, 0.15);
  border-radius: 1rem;
  background: rgba(255, 251, 246, 0.88);
}

.credit-card {
  margin-top: 3rem;
  padding: 1.1rem 1.2rem;
  border: 1px solid rgba(88, 55, 24, 0.15);
  border-radius: 1rem;
  background: linear-gradient(
    180deg,
    rgba(255, 249, 241, 0.96),
    rgba(250, 236, 224, 0.9)
  );
  box-shadow: 0 18px 40px rgba(69, 38, 13, 0.08);
}

.credit-card p {
  margin: 0.25rem 0;
  line-height: 1.6;
}

.credit-card__eyebrow {
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #b2542e;
  margin-top: 0.9rem;
}

.credit-card__eyebrow:first-child {
  margin-top: 0;
}

.credit-card a {
  color: #7f3418;
  text-decoration: underline;
}

:deep(h1),
:deep(h2),
:deep(h3) {
  font-family: "Fraunces", "Georgia", serif;
  line-height: 1.08;
}

:deep(h1) {
  font-size: clamp(2.8rem, 6vw, 4.6rem);
  margin-bottom: 1rem;
}

:deep(h2) {
  margin-top: 3rem;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
}

:deep(p),
:deep(li) {
  line-height: 1.7;
  color: #3c2a1d;
}

:deep(ul),
:deep(ol) {
  padding-left: 1.2rem;
}

:deep(pre) {
  overflow-x: auto;
  padding: 1rem 1.15rem;
  border-radius: 1rem;
  border: 1px solid rgba(88, 55, 24, 0.15);
  background: rgba(255, 251, 246, 0.88);
  box-shadow: 0 18px 40px rgba(69, 38, 13, 0.08);
}

:deep(code) {
  font-size: 0.95em;
}

:deep(blockquote) {
  margin: 1.5rem 0;
  padding: 0.9rem 1rem;
  border-left: 4px solid #b2542e;
  background: rgba(178, 84, 46, 0.08);
}

:deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

:deep(th),
:deep(td) {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(88, 55, 24, 0.15);
  text-align: left;
}
</style>
