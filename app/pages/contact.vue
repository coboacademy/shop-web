<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-r from-orange-600 to-rose-600 py-16 overflow-hidden">
      <div class="absolute inset-0 opacity-20">
        <div class="absolute top-0 left-0 w-64 h-64 bg-white rounded-full filter blur-3xl animate-pulse"></div>
        <div class="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up">Get in <span class="border-b-4 border-yellow-300">Touch</span></h1>
        <p class="text-orange-100 text-lg max-w-2xl mx-auto animate-fade-in-up animation-delay-200">We'd love to hear from you! Reach out with any questions, feedback, or catering inquiries.</p>
      </div>
    </section>

    <!-- Contact Content Grid -->
    <section class="py-12">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-12">
          <!-- Left Column: Contact Info & Business Hours -->
          <div class="space-y-8">
            <!-- Contact Info Cards -->
            <div class="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm">📞</span>
                Contact Information
              </h2>
              <div class="space-y-4">
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xl">📍</div>
                  <div>
                    <p class="font-semibold text-gray-800">Address</p>
                    <p class="text-gray-600">123 Foodie Street, Culinary District<br />New York, NY 10001</p>
                  </div>
                </div>
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xl">📱</div>
                  <div>
                    <p class="font-semibold text-gray-800">Phone</p>
                    <p class="text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xl">✉️</div>
                  <div>
                    <p class="font-semibold text-gray-800">Email</p>
                    <p class="text-gray-600">hello@durian.com</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Business Hours -->
            <div class="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm">⏰</span>
                Business Hours
              </h2>
              <div class="space-y-3">
                <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span class="font-medium text-gray-700">Monday - Thursday</span>
                  <span class="text-gray-600">11:00 AM - 10:00 PM</span>
                </div>
                <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span class="font-medium text-gray-700">Friday - Saturday</span>
                  <span class="text-gray-600">11:00 AM - 12:00 AM</span>
                </div>
                <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span class="font-medium text-gray-700">Sunday</span>
                  <span class="text-gray-600">12:00 PM - 8:00 PM</span>
                </div>
              </div>
              <div class="mt-4 p-3 bg-orange-50 rounded-lg text-sm text-orange-700 flex items-center gap-2">
                <span>🎉</span> Happy Hour: Weekdays 3PM - 6PM (20% off drinks)
              </div>
            </div>

            <!-- Social Links -->
            <div class="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm">🌐</span>
                Follow Us
              </h2>
              <div class="flex gap-4">
                <a href="#" class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl hover:bg-orange-500 hover:text-white transition-colors">📘</a>
                <a href="#" class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl hover:bg-orange-500 hover:text-white transition-colors">📷</a>
                <a href="#" class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl hover:bg-orange-500 hover:text-white transition-colors">🐦</a>
                <a href="#" class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl hover:bg-orange-500 hover:text-white transition-colors">🎵</a>
              </div>
            </div>
          </div>

          <!-- Right Column: Contact Form -->
          <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm">✍️</span>
              Send Us a Message
            </h2>
            <form @submit.prevent="handleSubmit" class="space-y-5">
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-700 font-medium mb-2">First Name *</label>
                  <input 
                    v-model="form.firstName"
                    type="text" 
                    required
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label class="block text-gray-700 font-medium mb-2">Last Name *</label>
                  <input 
                    v-model="form.lastName"
                    type="text" 
                    required
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label class="block text-gray-700 font-medium mb-2">Email Address *</label>
                <input 
                  v-model="form.email"
                  type="email" 
                  required
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  placeholder="hello@example.com"
                />
              </div>
              <div>
                <label class="block text-gray-700 font-medium mb-2">Phone Number</label>
                <input 
                  v-model="form.phone"
                  type="tel" 
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <label class="block text-gray-700 font-medium mb-2">Subject *</label>
                <select 
                  v-model="form.subject"
                  required
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                >
                  <option value="">Select a subject</option>
                  <option>General Inquiry</option>
                  <option>Catering Request</option>
                  <option>Feedback</option>
                  <option>Complaint</option>
                  <option>Partnership</option>
                </select>
              </div>
              <div>
                <label class="block text-gray-700 font-medium mb-2">Message *</label>
                <textarea 
                  v-model="form.message"
                  rows="5"
                  required
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
                  placeholder="Tell us what's on your mind..."
                ></textarea>
              </div>
              <button 
                type="submit"
                :disabled="isSubmitting"
                class="w-full py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {{ isSubmitting ? 'Sending...' : 'Send Message' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- Google Maps Section -->
    <section class="pb-12">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
          <h2 class="text-2xl font-bold text-gray-800 p-6 pb-0">Find Us</h2>
          <div class="h-96 w-full">
            <iframe 
              src="https://maps.google.com/maps?width=600&height=400&hl=en&q=Norton%2BUniversity%2F%4011.5881108%2C104.9220683%2C16z%2Fdata%3D!4m22!1m15!4m14!1m6!1m2!1s0x310953fd9f9a51e9%3A0xc26eafcd2ed5ca29!2sNorton%2BUniversity%2C%2BKeo%2BChenda%2BSt%2C%2BPhnom%2BPenh%2B12000!2m2!1d104.9301205!2d11.5881108!1m6!1m2!1s0x310953fd9f9a51e9%3A0xc26eafcd2ed5ca29!2sNorton%2BUniversity%2C%2BKeo%2BChenda%2BSt%2C%2BPhnom%2BPenh%2B12000!2m2!1d104.9301205!2d11.5881108!3m5!1s0x310953fd9f9a51e9%3A0xc26eafcd2ed5ca29!8m2!3d11.5881108!4d104.9301205!16s%252Fm%252F04jbf6t%3Fentry%3Dttu%26g_ep%3DEgoyMDI2MDQwNS4wIKXMDSoASAFQAw%253D%253D&t=&z=14&ie=UTF8&iwloc=B&output=embed" 
              width="100%" 
              height="100%" 
              style="border:0;" 
              allowfullscreen="" 
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
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
import { ref } from 'vue'

// Form state
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
})
const isSubmitting = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
let toastTimeout = null

// Handle form submission
const handleSubmit = async () => {
  isSubmitting.value = true
  // Simulate API call (replace with actual endpoint)
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Form submitted:', form.value)
    toastMessage.value = 'Message sent successfully! We\'ll get back to you soon.'
    showToast.value = true
    // Reset form
    form.value = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    }
  } catch (error) {
    toastMessage.value = 'Something went wrong. Please try again.'
    showToast.value = true
  } finally {
    isSubmitting.value = false
    if (toastTimeout) clearTimeout(toastTimeout)
    toastTimeout = setTimeout(() => {
      showToast.value = false
    }, 3000)
  }
}

// SEO
useHead({
  title: 'Contact Us - Durian',
  meta: [
    { name: 'description', content: 'Get in touch with Durian. Contact us for inquiries, feedback, or catering. Find our location and business hours.' }
  ]
})
</script>

<style scoped>
/* Reusable animations */
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