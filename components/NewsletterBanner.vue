<template>
  <section class="mt-24">
    <div class="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-10 py-16 text-white shadow-2xl">
      <div class="grid gap-10 lg:grid-cols-[3fr,2fr] lg:items-center">
        <div>
          <p class="text-sm uppercase tracking-[0.25em] text-primary-300">Member exclusive</p>
          <h2 class="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Unlock early access drops</h2>
          <p class="mt-4 max-w-xl text-sm leading-6 text-slate-200">
            Join our private community to receive first looks at product collaborations, city pop-up invites, and styling workshops hosted by our team.
          </p>
        </div>
        <form class="flex flex-col gap-4 lg:flex-row">
          <input
            type="email"
            required
            placeholder="Enter your email"
            class="w-full rounded-full border border-white/30 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-slate-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
          />
          <button
            type="submit"
            class="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-400"
          >
            Join waitlist
          </button>
        </form>
      </div>
    </div>
  </section>
</template>
