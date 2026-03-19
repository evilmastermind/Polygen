<script setup lang="ts">
import type { Collections } from "@nuxt/content";

const route = useRoute();

const { data: page } = await useAsyncData("landing", () =>
  queryCollection("landing" as keyof Collections)
    .path(route.path)
    .first()
);

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page not found",
    fatal: true
  });
}

const title = page.value.seo?.title || page.value.title;
const description = page.value.seo?.description || page.value.description;
const exampleCode = `import { polygen } from "polygen";

const grammar = \

\`S ::= Party Hook Treasure;

Party ::= "The ranger and the cleric enter the ";
Hook ::= tavern | ruin | crypt;
Treasure ::= ", where they find a " Loot ".";
Loot ::= "dragon-marked shield" | "bag of holding" | "mimic chest";\`;

const result = polygen(grammar);
// "The ranger and the cleric enter the crypt, where they find a mimic chest."`;

useSeo({
  title,
  description,
  type: "website"
});
</script>

<template>
  <main v-if="page" class="relative overflow-hidden">
    <UContainer class="py-16 sm:py-24">
      <div class="mx-auto max-w-5xl space-y-10">
        <section class="space-y-8 text-center sm:space-y-10">
          <div class="relative space-y-5">
            <div class="relative z-1">
              <div class="relative">
                <Logo class="relative mx-auto z-1 fill-default h-24 w-auto" />
                <div class="glow z-0"></div>
                <div class="particles z-0">
                  <div class="rotate">
                    <div class="angle">
                      <div class="size">
                        <div class="position">
                          <div class="pulse">
                            <div class="particle"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="angle">
                      <div class="size">
                        <div class="position">
                          <div class="pulse">
                            <div class="particle"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="angle">
                      <div class="size">
                        <div class="position">
                          <div class="pulse">
                            <div class="particle"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <h1
                class="text-5xl font-semibold tracking-tight text-highlighted sm:text-6xl my-6"
              >
                {{ page.title || "Polygen" }}
              </h1>

              <p
                class="mx-auto max-w-3xl whitespace-pre-line text-lg leading-8 text-toned sm:text-xl"
              >
                {{ page.description }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap justify-center gap-3">
            <UButton
              to="/docs/getting-started"
              size="xl"
              trailing-icon="i-lucide-arrow-right"
            >
              Get Started
            </UButton>
            <UButton
              to="https://github.com/alvisespano/Polygen"
              target="_blank"
              size="xl"
              color="neutral"
              variant="outline"
              icon="i-simple-icons-github"
            >
              Original Project
            </UButton>
          </div>
        </section>

        <section>
          <UCard class="border-default/70 shadow-xl shadow-primary/10">
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p
                    class="text-sm uppercase tracking-[0.22em] text-primary-300"
                  >
                    Example
                  </p>
                  <p class="mt-1 text-lg font-medium">
                    Roll a quick D&amp;D-flavored scene
                  </p>
                </div>
                <UIcon name="i-lucide-dices" class="size-5 text-primary-300" />
              </div>
            </template>

            <ProsePre
              filename="example.ts"
              language="ts"
              class="text-sm leading-6"
            >
              {{ exampleCode }}
            </ProsePre>
          </UCard>
        </section>

        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <UCard
            to="/docs/getting-started"
            class="border-default/70 bg-default/80 backdrop-blur"
          >
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-highlighted">
                <UIcon name="i-lucide-package" class="size-5 text-primary" />
                <span class="font-medium">Library-first package</span>
              </div>
              <p class="text-sm leading-6 text-toned">
                Import Polygen in modern ESM projects without depending on the
                legacy CLI.
              </p>
            </div>
          </UCard>

          <UCard
            to="/docs/getting-started/randomness"
            class="border-default/70 bg-default/80 backdrop-blur"
          >
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-highlighted">
                <UIcon name="i-lucide-dices" class="size-5 text-primary" />
                <span class="font-medium">Reproducible randomness</span>
              </div>
              <p class="text-sm leading-6 text-toned">
                Keep deterministic seeds when needed and replay unseeded runs
                through the resolved seed.
              </p>
            </div>
          </UCard>

          <UCard
            to="/docs/guides/grammar-basics"
            class="border-default/70 bg-default/80 backdrop-blur"
          >
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-highlighted">
                <UIcon
                  name="i-lucide-file-code-2"
                  class="size-5 text-primary"
                />
                <span class="font-medium">Grammar guides</span>
              </div>
              <p class="text-sm leading-6 text-toned">
                Learn operators, labels, scoping, recursion techniques,
                diagnostics, and syntax reference material.
              </p>
            </div>
          </UCard>

          <UCard
            to="/docs/project/status-compatibility"
            class="border-default/70 bg-default/80 backdrop-blur"
          >
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-highlighted">
                <UIcon
                  name="i-lucide-shield-alert"
                  class="size-5 text-primary"
                />
                <span class="font-medium">Compatibility notes</span>
              </div>
              <p class="text-sm leading-6 text-toned">
                Track what already matches the historical project, what changed
                intentionally, and what remains deferred.
              </p>
            </div>
          </UCard>
        </section>

        <section>
          <UCard class="border-default/70 bg-default/75 backdrop-blur">
            <template #header>
              <div class="flex items-center gap-3">
                <UIcon
                  name="i-lucide-scroll-text"
                  class="size-5 text-primary"
                />
                <span class="font-medium text-highlighted">Credits</span>
              </div>
            </template>

            <div class="space-y-4 text-sm leading-6 text-toned sm:text-base">
              <p>
                This documentation site and TypeScript rewrite are an AI-made
                conversion of the original Polygen project.
              </p>
              <p>
                Original creators: Alvise Spano&apos; (concept, programming, and
                documentation) and Enrico Zeffiro (polygen.org site).
              </p>
              <p>
                The original project is released under GPL-2, and this rewrite
                preserves that licensing direction.
              </p>
            </div>
          </UCard>
        </section>
      </div>
    </UContainer>
  </main>
</template>
<style scoped>
.glow {
  --glow-color-1: var(--color-olive-200);
  --glow-color-2: var(--color-slate-200);
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  animation: glow 3s linear 0s infinite alternate;
}

.particles {
  --particle-color-1: var(--color-purple-500);
  --particle-color-2: var(--color-blue-500);
  --particle-color-3: var(--color-green-500);
  --particle-color-4: var(--color-yellow-500);
  --particle-color-5: var(--color-orange-500);
  --particle-color-6: var(--color-red-500);
  position: absolute;
  top: calc(50% - 50px);
  left: calc(50% - 50px);
  width: 100px;
  height: 100px;
}

.rotate {
  position: absolute;
  top: calc(50% - 5px);
  left: calc(50% - 5px);
  width: 10px;
  height: 10px;
}

.angle {
  position: absolute;
  top: 0;
  left: 0;
}

.size {
  position: absolute;
  top: 0;
  left: 0;
}

.position {
  position: absolute;
  top: 0;
  left: 0;
}

.pulse {
  position: absolute;
  top: 0;
  left: 0;
}

.particle {
  position: absolute;
  top: calc(50% - 5px);
  left: calc(50% - 5px);
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.rotate {
  animation: rotate 20s linear 0s infinite alternate;
}

.pulse {
  animation: pulse 1.5s linear 0s infinite alternate;
}

@keyframes glow {
  0% {
    transform: rotate(0deg);
    box-shadow:
      0 0 60px 20px var(--glow-color-1),
      25px 15px 50px 10px #fff,
      -5px -25px 30px 5px #fff;
  }
  100% {
    transform: rotate(5deg);
    box-shadow:
      0 0 90px 20px var(--glow-color-2),
      35px 20px 40px 10px #fff,
      -30px -30px 40px 5px #fff;
  }
}

@keyframes rotate {
  0% {
    -webkit-transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
  }
}

@keyframes angle {
  0% {
    -webkit-transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
  }
}

@keyframes size {
  0% {
    -webkit-transform: scale(0.2);
  }
  100% {
    -webkit-transform: scale(0.6);
  }
}

@keyframes position {
  0% {
    -webkit-transform: translate3d(0, 0, 0);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    -webkit-transform: translate3d(100px, 100px, 0);
    opacity: 0;
  }
}

@keyframes pulse {
  0% {
    -webkit-transform: scale(1.5);
  }
  100% {
    -webkit-transform: scale(0.5);
  }
}

@keyframes particle {
  0% {
    box-shadow:
      inset 0 0 20px 20px var(--particle-color-1),
      0 0 50px 10px var(--particle-color-1),
      inset 0 0 80px 80px var(--particle-color-1);
  }
  33.33% {
    box-shadow:
      inset 0 0 20px 20px var(--particle-color-2),
      0 0 130px 10px var(--particle-color-2),
      inset 0 0 50px 50px var(--particle-color-2);
  }
  33.34% {
    box-shadow:
      inset 0 0 20px 20px var(--particle-color-3),
      0 0 50px 10px var(--particle-color-3),
      inset 0 0 80px 80px var(--particle-color-3);
  }
  66.66% {
    box-shadow:
      inset 0 0 20px 20px var(--particle-color-4),
      0 0 130px 10px var(--particle-color-4),
      inset 0 0 50px 50px var(--particle-color-4);
  }
  66.67% {
    box-shadow:
      inset 0 0 20px 20px var(--particle-color-5),
      0 0 50px 10px var(--particle-color-5),
      inset 0 0 80px 80px var(--particle-color-5);
  }
  100% {
    box-shadow:
      inset 0 0 20px 20px var(--particle-color-6),
      0 0 130px 10px var(--particle-color-6),
      inset 0 0 50px 50px var(--particle-color-6);
  }
}

.rotate .angle:nth-child(1) {
  /* change the angle every 2 seconds */
  animation: angle 10s steps(5) 0s infinite;
}
.rotate .angle:nth-child(1) .size {
  /* change the size of the particle every 2 seconds */
  animation: size 10s steps(5) 0s infinite;
}
.rotate .angle:nth-child(1) .particle {
  /* animate the glow and change the color every 2 seconds */
  animation: particle 6s linear infinite alternate;
}
.rotate .angle:nth-child(1) .position {
  /* animate the fly out of the particle and its fade out at the end */
  animation: position 1s linear 0s infinite;
}

.rotate .angle:nth-child(2) {
  /* change the angle every 2 seconds */
  animation: angle 4.95s steps(3) -1.65s infinite;
}
.rotate .angle:nth-child(2) .size {
  /* change the size of the particle every 2 seconds */
  animation: size 4.95s steps(3) -1.65s infinite alternate;
}
.rotate .angle:nth-child(2) .particle {
  /* animate the glow and change the color every 2 seconds */
  animation: particle 4.95s linear -3.3s infinite alternate;
}
.rotate .angle:nth-child(2) .position {
  /* animate the fly out of the particle and its fade out at the end */
  animation: position 1s linear 0s infinite;
}

.rotate .angle:nth-child(3) {
  /* change the angle every 2 seconds */
  animation: angle 13.76s steps(8) -6.88s infinite;
}
.rotate .angle:nth-child(3) .size {
  /* change the size of the particle every 2 seconds */
  animation: size 6.88s steps(4) -5.16s infinite alternate;
}
.rotate .angle:nth-child(3) .particle {
  /* animate the glow and change the color every 2 seconds */
  animation: particle 5.16s linear -1.72 infinite alternate;
}
.rotate .angle:nth-child(3) .position {
  /* animate the fly out of the particle and its fade out at the end */
  animation: position 1s linear 0s infinite;
}

.rotate .angle:nth-child(5) .position {
  /* animate the fly out of the particle and its fade out at the end */
  animation: position 2.3s linear 0s infinite;
}
</style>
