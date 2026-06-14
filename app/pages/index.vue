<template>
  <main class="min-h-screen bg-slate-950 text-slate-100">
    <section class="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:py-16">
      <nav class="mb-12 flex items-center justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Local Sprite Lab</p>
          <h1 class="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Sprite Forge</h1>
        </div>
        <div class="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
          Phase 3 Upload Flow
        </div>
      </nav>

      <div class="grid flex-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section class="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20">
          <h2 class="text-2xl font-bold">Generate game-ready sprite variants</h2>
          <p class="mt-4 max-w-2xl text-slate-300">
            Upload one source sprite, describe the transformation, choose a style preset and target size, then generate clean PNG variants through OpenRouter.
          </p>

          <div class="mt-8 grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-5">
              <p class="font-semibold text-slate-100">Current milestone</p>
              <p class="mt-2 text-sm text-slate-400">Upload source images, validate file type and size, extract image metadata, and persist upload records.</p>
            </div>
            <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p class="font-semibold text-slate-100">Next milestone</p>
              <p class="mt-2 text-sm text-slate-400">Style presets, deterministic prompt building, variant directions, and generation input validation.</p>
            </div>
          </div>
        </section>

        <aside class="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
          <h2 class="text-xl font-bold">MVP Scope</h2>
          <ul class="mt-5 space-y-3 text-sm text-slate-300">
            <li class="rounded-xl bg-slate-900 p-3">Local-first Nuxt app, no auth or SaaS assumptions.</li>
            <li class="rounded-xl bg-slate-900 p-3">OpenRouter image generation, one model call per variant.</li>
            <li class="rounded-xl bg-slate-900 p-3">Sharp post-processing into exact target-size PNG sprites.</li>
            <li class="rounded-xl bg-slate-900 p-3">SQLite metadata with filesystem image storage.</li>
          </ul>
        </aside>
      </div>
    </section>
  </main>
</template>
