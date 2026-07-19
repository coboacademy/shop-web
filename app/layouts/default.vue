<template>
  <div class="min-h-screen font-sans antialiased selection:bg-green-100 selection:text-green-700">
    <nav class="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-100 shadow-sm">
      <div class="max-w-screen-2xl mx-auto px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          
          <nuxt-link to="/" class="flex items-center gap-x-3 group relative">
            <div class="relative w-12 h-12 rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5 bg-white flex items-center justify-center transition-all duration-500 ease-out group-hover:shadow-xl group-hover:shadow-green-500/30 group-hover:-translate-y-1 group-hover:rotate-6">
              <div class="absolute inset-0 bg-gradient-to-tr from-green-100 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <img src="/favicon.ico" alt="Logo" class="relative z-10 w-9 h-9 object-contain transition-all duration-500 group-hover:scale-110 group-hover:-rotate-12" />
            </div>
            <span class="text-2xl font-bold tracking-tight text-gray-800 flex items-center">
              <span class="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent bg-[length:200%_auto] transition-all duration-700 group-hover:bg-[right_center]">Durian</span>
              <span class="text-green-500 transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 ml-0.5">X</span>
            </span>
          </nuxt-link>

          <div class="hidden md:flex items-center gap-x-1 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
            <NuxtLink
              v-for="item in ['Home', 'Menu', 'Offers', 'Contact', 'About']"
              :key="item"
              :to="item === 'Home' ? '/' : `/${item.toLowerCase()}`"
              class="px-5 py-2 text-gray-600 hover:text-green-600 font-bold text-sm transition-all duration-300 rounded-xl hover:bg-white hover:shadow-sm active:scale-95 relative group/link"
              exact-active-class="bg-white text-green-600 shadow-sm"
            >
              {{ item }}
              <span class="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover/link:w-10"></span>
            </NuxtLink>
          </div>

          <div class="hidden md:block">
            <button class="group px-7 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 hover:-translate-y-1 active:scale-95 transition-all duration-500 flex items-center gap-x-2">
              Order Now
              <span class="transition-transform duration-300 group-hover:translate-x-1 group-hover:rotate-12 inline-block">🚀</span>
            </button>
          </div>

          <button @click="mobileMenuOpen = true" class="md:hidden p-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            </svg>
          </button>
        </div>
      </div>
    </nav>

    <transition name="menu-overlay">
      <div v-if="mobileMenuOpen" class="fixed inset-0 z-[100]">
        <div class="absolute inset-0 bg-gray-950/40 backdrop-blur-md" @click="mobileMenuOpen = false"></div>
        <aside class="absolute right-4 top-4 bottom-4 w-[calc(100%-2rem)] max-w-sm bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          <div class="flex items-center justify-between p-8">
            <div class="flex items-center gap-x-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <span class="text-white font-black text-xl animate-pulse">D</span>
              </div>
              <span class="text-xl font-bold text-gray-800 tracking-tight">Durian<span class="text-green-500">X</span></span>
            </div>
            <button @click="mobileMenuOpen = false" class="p-3 rounded-2xl bg-gray-100 hover:bg-green-50 text-gray-500 hover:text-green-600 transition-all active:rotate-90">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav class="px-4 pb-8 flex-1 overflow-y-auto">
            <div class="flex flex-col gap-y-2">
              <NuxtLink
                v-for="(link, index) in ['Home', 'Menu', 'Offers', 'Contact', 'About']"
                :key="link"
                :to="link === 'Home' ? '/' : `/${link.toLowerCase()}`"
                class="group block py-4 px-6 rounded-2xl text-gray-700 font-bold hover:bg-green-50 hover:text-green-600 transition-all animate-stagger-in"
                :style="{ animationDelay: `${index * 100}ms` }"
                exact-active-class="bg-green-100 text-green-700"
                @click="mobileMenuOpen = false"
              >
                <div class="flex justify-between items-center">
                  {{ link }}
                  <span class="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
                </div>
              </NuxtLink>
            </div>
            <button class="w-full mt-10 py-5 bg-gray-900 text-white font-bold rounded-2xl shadow-xl shadow-gray-200 active:scale-95 transition-all">
              Start Order 😋
            </button>
          </nav>
        </aside>
      </div>
    </transition>

    <slot />

    <footer class="bg-gray-950 text-white pt-24 pb-12 overflow-hidden relative">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent"></div>
      
      <div class="max-w-screen-2xl mx-auto px-6 lg:px-8 relative z-10">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-16">
          
          <div class="md:col-span-5 space-y-8">
            <nuxt-link to="/" class="flex items-center gap-x-4 group inline-flex">
              <div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-700 group-hover:bg-green-500 group-hover:rotate-[360deg]">
                <img src="/favicon.ico" alt="Logo" class="w-10 h-10 object-contain group-hover:brightness-0 group-hover:invert" />
              </div>
              <span class="text-3xl font-bold tracking-tight text-white flex items-center">
                <span>Durian</span>
                <span class="text-green-500 ml-1 transition-transform group-hover:scale-125 group-hover:-rotate-12">X</span>
              </span>
            </nuxt-link>
            <p class="text-gray-400 text-lg leading-relaxed max-w-sm">
              The world's most <span class="text-green-400 font-medium italic underline decoration-green-500/30">daring</span> flavor delivery service. Pure taste, zero compromise.
            </p>
          </div>

          <div class="md:col-span-2">
            <h4 class="text-green-500 font-black uppercase tracking-widest text-[10px] mb-8">Discovery</h4>
            <ul class="space-y-4">
              <li v-for="l in ['Menu', 'Offers', 'About', 'Contact']" :key="l">
                <NuxtLink :to="`/${l.toLowerCase()}`" class="text-gray-400 hover:text-white transition-all duration-300 flex items-center group/item">
                  <span class="h-1 w-0 bg-green-500 rounded-full transition-all duration-300 group-hover/item:w-3 group-hover/item:mr-3"></span>
                  {{ l }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div class="md:col-span-2">
            <h4 class="text-green-500 font-black uppercase tracking-widest text-[10px] mb-8">Support</h4>
            <ul class="space-y-4 text-gray-400">
              <li v-for="l in ['FAQs', 'Privacy', 'Terms']" :key="l">
                <NuxtLink :to="`/${l.toLowerCase()}`" class="hover:text-green-400 transition-colors">{{ l }}</NuxtLink>
              </li>
            </ul>
          </div>

          <div class="md:col-span-3">
            <h4 class="text-green-500 font-black uppercase tracking-widest text-[10px] mb-8">Join the Vibe</h4>
            <div class="flex gap-x-4">
              <a v-for="i in 3" :key="i" href="#" class="w-14 h-14 bg-white/5 border border-white/10 rounded-[20px] flex items-center justify-center hover:bg-green-500 hover:border-green-500 hover:-translate-y-2 hover:rotate-6 transition-all duration-500 text-gray-400 hover:text-white group">
                <svg class="w-6 h-6 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div class="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-gray-500 text-sm">
          <p>© 2026 DurianX. Stay <span class="text-green-600 font-bold">Flavorful</span>.</p>
          <div class="flex items-center gap-x-6">
            <span class="flex items-center gap-x-2">
              <span class="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              Live Tracking Enabled
            </span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
const mobileMenuOpen = ref(false);
</script>

<style>
/* 1. Enhanced Animation: Slide Up & Fade for Mobile Menu */
@keyframes slide-up {
  from { transform: translateY(20px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
.animate-slide-up {
  animation: slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 2. Staggered Link Entry Animation */
@keyframes stagger-in {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-stagger-in {
  animation: stagger-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* 3. Vue Transition Classes */
.menu-overlay-enter-active, .menu-overlay-leave-active {
  transition: opacity 0.4s ease;
}
.menu-overlay-enter-from, .menu-overlay-leave-to {
  opacity: 0;
}

/* 4. Global Playful Interactions */
.active-link-indicator {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 5. Custom Scrollbar (Green Version) */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #f8fafc; }
::-webkit-scrollbar-thumb {
  background: #22c55e;
  border-radius: 100px;
  border: 2px solid #f8fafc;
}
::-webkit-scrollbar-thumb:hover { background: #16a34a; }
</style>