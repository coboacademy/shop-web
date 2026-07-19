<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-r from-amber-500 to-orange-600 py-16 overflow-hidden">
      <div class="absolute inset-0 opacity-20">
        <div class="absolute top-0 left-0 w-64 h-64 bg-white rounded-full filter blur-3xl animate-pulse"></div>
        <div class="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up">Special <span class="border-b-4 border-yellow-300">Offers</span></h1>
        <p class="text-amber-100 text-lg max-w-2xl mx-auto animate-fade-in-up animation-delay-200">Don't miss out on these limited-time deals! Save big on your favorite dishes.</p>
      </div>
    </section>

    <!-- Countdown Banner -->
    <section class="py-8 bg-white shadow-sm">
      <div class="container mx-auto px-4 text-center">
        <div class="inline-flex items-center gap-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-full px-6 py-3 shadow-md">
          <span class="text-red-600 font-bold animate-pulse">⏰ HURRY!</span>
          <span class="text-gray-700">Flash sale ends in:</span>
          <div class="flex gap-2">
            <div class="bg-white rounded-lg px-3 py-1 shadow text-center">
              <span class="text-2xl font-bold text-orange-600">{{ countdown.hours }}</span>
              <span class="text-xs text-gray-500 block">Hours</span>
            </div>
            <span class="text-2xl font-bold">:</span>
            <div class="bg-white rounded-lg px-3 py-1 shadow text-center">
              <span class="text-2xl font-bold text-orange-600">{{ countdown.minutes }}</span>
              <span class="text-xs text-gray-500 block">Mins</span>
            </div>
            <span class="text-2xl font-bold">:</span>
            <div class="bg-white rounded-lg px-3 py-1 shadow text-center">
              <span class="text-2xl font-bold text-orange-600">{{ countdown.seconds }}</span>
              <span class="text-xs text-gray-500 block">Secs</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Offer Cards Grid -->
    <section class="py-12">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Offer Card 1 - 20% OFF -->
          <div class="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3">
            <div class="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full rotate-[-5deg] shadow-lg">
              LIMITED TIME
            </div>
            <div class="h-48 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&h=400&fit=crop" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="offer" />
            </div>
            <div class="p-6">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-2xl font-bold text-gray-800">20% OFF</h3>
                <span class="text-orange-500 font-bold">🎉 First Order</span>
              </div>
              <p class="text-gray-500 mb-4">Get 20% off on your very first order. No minimum order required.</p>
              <div class="bg-gray-100 rounded-lg p-3 mb-4 flex justify-between items-center">
                <code class="font-mono text-orange-600 font-bold">WELCOME20</code>
                <button @click="copyCode('WELCOME20')" class="text-sm bg-white px-3 py-1 rounded-full shadow hover:shadow-md transition">Copy Code</button>
              </div>
              <button class="w-full py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full font-semibold hover:shadow-lg transition">Order Now</button>
            </div>
          </div>

          <!-- Offer Card 2 - Buy 1 Get 1 -->
          <div class="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3">
            <div class="absolute top-4 left-4 z-10 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              BEST DEAL
            </div>
            <div class="h-48 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="offer" />
            </div>
            <div class="p-6">
              <h3 class="text-2xl font-bold text-gray-800 mb-2">Buy 1 Get 1 Free</h3>
              <p class="text-gray-500 mb-4">On all large pizzas. Valid every Tuesday & Wednesday.</p>
              <div class="bg-gray-100 rounded-lg p-3 mb-4 flex justify-between items-center">
                <code class="font-mono text-orange-600 font-bold">BOGO2025</code>
                <button @click="copyCode('BOGO2025')" class="text-sm bg-white px-3 py-1 rounded-full shadow hover:shadow-md transition">Copy Code</button>
              </div>
              <button class="w-full py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full font-semibold hover:shadow-lg transition">Order Now</button>
            </div>
          </div>

          <!-- Offer Card 3 - Free Delivery -->
          <div class="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3">
            <div class="h-48 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="offer" />
            </div>
            <div class="p-6">
              <h3 class="text-2xl font-bold text-gray-800 mb-2">Free Delivery</h3>
              <p class="text-gray-500 mb-4">On orders above $25. Available for a limited time.</p>
              <div class="bg-gray-100 rounded-lg p-3 mb-4 flex justify-between items-center">
                <code class="font-mono text-orange-600 font-bold">FREESHIP</code>
                <button @click="copyCode('FREESHIP')" class="text-sm bg-white px-3 py-1 rounded-full shadow hover:shadow-md transition">Copy Code</button>
              </div>
              <button class="w-full py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full font-semibold hover:shadow-lg transition">Order Now</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Referral Section -->
    <section class="py-12 bg-gradient-to-r from-orange-500 to-rose-600 mx-4 sm:mx-6 lg:mx-8 rounded-3xl shadow-xl mb-12">
      <div class="container mx-auto px-6 py-8 text-center text-white">
        <h2 class="text-3xl md:text-4xl font-bold mb-3">Invite Friends, Get $10</h2>
        <p class="text-orange-100 mb-6">Share your unique referral link and earn $10 credit when they order.</p>
        <div class="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
          <input type="text" readonly :value="referralLink" class="flex-1 px-4 py-3 rounded-full text-gray-800 bg-white/90 focus:outline-none" />
          <button @click="copyCode(referralLink)" class="px-6 py-3 bg-white text-orange-600 rounded-full font-bold hover:shadow-lg transition">Copy Link</button>
        </div>
      </div>
    </section>

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="showToast" class="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2">
        <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Countdown timer (ends in 2 days from now for demo)
const countdown = ref({ hours: '00', minutes: '00', seconds: '00' })
let timerInterval = null

const updateCountdown = () => {
  const now = new Date()
  const end = new Date()
  end.setDate(now.getDate() + 2)
  end.setHours(23, 59, 59, 999)
  const diff = end - now
  if (diff <= 0) {
    countdown.value = { hours: '00', minutes: '00', seconds: '00' }
    if (timerInterval) clearInterval(timerInterval)
    return
  }
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (3600000)) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  countdown.value = {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0')
  }
}

onMounted(() => {
  updateCountdown()
  timerInterval = setInterval(updateCountdown, 1000)
})
onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

// Referral link (dynamic based on current URL)
const referralLink = ref('')
if (process.client) {
  referralLink.value = `${window.location.origin}/?ref=${Math.random().toString(36).substring(2, 8)}`
}

// Toast notification
const showToast = ref(false)
const toastMessage = ref('')
let toastTimeout = null

const copyCode = (text) => {
  navigator.clipboard.writeText(text)
  toastMessage.value = 'Copied to clipboard!'
  showToast.value = true
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    showToast.value = false
  }, 2000)
}

// SEO
useHead({
  title: 'Offers & Deals - Durian',
  meta: [
    { name: 'description', content: 'Check out our latest offers, discounts, and limited-time deals. Save money on your favorite meals.' }
  ]
})
</script>

<style scoped>
/* Existing animations from previous pages */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}
.animation-delay-200 {
  animation-delay: 0.2s;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>