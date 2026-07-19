<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <section
      class="relative bg-gradient-to-r from-orange-600 to-rose-600 py-16 overflow-hidden"
    >
      <div class="absolute inset-0 opacity-20">
        <div
          class="absolute top-0 left-0 w-64 h-64 bg-white rounded-full filter blur-3xl animate-pulse"
        ></div>
        <div
          class="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300 rounded-full filter blur-3xl animate-pulse delay-1000"
        ></div>
      </div>
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up">
          Our <span class="border-b-4 border-yellow-300">Story</span>
        </h1>
        <p
          class="text-orange-100 text-lg max-w-2xl mx-auto animate-fade-in-up animation-delay-200"
        >
          Serving happiness with every bite – fresh ingredients, bold flavors, and a
          passion for food.
        </p>
      </div>
    </section>

    <!-- About Content -->
    <section class="py-12">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Our Story -->
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
          <div class="grid md:grid-cols-2 gap-0">
            <div class="h-64 md:h-auto overflow-hidden">
              <img
                src="/images/kitchen-story.png"
                alt="Our kitchen"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-6 md:p-8 flex flex-col justify-center">
              <h2 class="text-3xl font-bold text-gray-800 mb-4">How It All Began</h2>
              <p class="text-gray-600 leading-relaxed mb-4">
                Founded in 2024, Durian started with a simple idea: bring bold, authentic
                flavors to your doorstep without compromising on quality. Our founder, a
                culinary enthusiast, wanted to share the love for fresh, locally-sourced
                ingredients with the community.
              </p>
              <p class="text-gray-600 leading-relaxed">
                What began as a small pop-up kitchen has grown into a beloved food
                delivery brand. Every dish is crafted with care, passion, and a dash of
                creativity. We believe that great food brings people together – and we're
                honored to be part of your table.
              </p>
            </div>
          </div>
        </div>

        <!-- Mission & Values -->
        <div class="grid md:grid-cols-3 gap-8 mb-16">
          <div
            class="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow group"
          >
            <div
              class="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2" fill="currentColor"/><line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" stroke-width="2"/><line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" stroke-width="2"/><line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" stroke-width="2"/><line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2"/></svg>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Our Mission</h3>
            <p class="text-gray-500">
              To deliver delicious, high-quality meals that bring joy and convenience to
              every home, while supporting local farmers and sustainable practices.
            </p>
          </div>
          <div
            class="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow group"
          >
            <div
              class="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><ellipse cx="12" cy="12" rx="9" ry="6" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/></svg>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Our Vision</h3>
            <p class="text-gray-500">
              To become the most loved food delivery brand, known for uncompromising
              taste, freshness, and a seamless customer experience.
            </p>
          </div>
          <div
            class="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow group"
          >
            <div
              class="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polygon points="12,2 22,9 17,22 7,22 2,9" stroke="currentColor" stroke-width="2.5" fill="none"/><polygon points="12,2 17,22 7,22" fill="currentColor" opacity="0.2"/></svg>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Our Values</h3>
            <p class="text-gray-500">
              Quality, integrity, community, and innovation. We never compromise on
              ingredients and always put our customers first.
            </p>
          </div>
        </div>

        <!-- Team Section - Professional Profile Cards -->
        <div class="mb-16">
          <h2 class="text-3xl font-bold text-center text-gray-800 mb-4">
            Meet the
            <span
              class="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500"
              >Dream Team</span
            >
          </h2>
          <p class="text-center text-gray-500 max-w-2xl mx-auto mb-12">
            Passionate experts dedicated to bringing you the best culinary experience.
          </p>

          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <!-- Chef Profile -->
            <div
              class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
            >
              <div
                class="relative h-64 overflow-hidden bg-gradient-to-br from-orange-100 to-rose-100"
              >
                <img
                  src="/images/team/chef-michael.jpg"
                  alt="Chef Michael"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="p-5 text-center">
                <h3 class="text-xl font-bold text-gray-800">Chef Michael</h3>
                <p class="text-orange-500 font-semibold text-sm mb-2">
                  Head Chef / Culinary Director
                </p>
                <p class="text-gray-500 text-sm mb-4">
                  20+ years of experience in Michelin-starred kitchens. Passionate about
                  fusion cuisine and farm-to-table ingredients.
                </p>
                <div class="flex justify-center gap-3">
                  <a
                    href="mailto:chef@durian.com"
                    class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2.01 2.01 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2"/></svg>
                  </a>
                  <a
                    href="#"
                    class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
                  </a>
                  <a
                    href="#"
                    class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 21l1.8-4A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  </a>
                </div>
              </div>
            </div>

            <!-- Operations Manager Profile -->
            <div
              class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
            >
              <div
                class="relative h-64 overflow-hidden bg-gradient-to-br from-orange-100 to-rose-100"
              >
                <img
                  src="/images/team/manager-sarah.jpg"
                  alt="Sarah Lee"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="p-5 text-center">
                <h3 class="text-xl font-bold text-gray-800">Sarah Lee</h3>
                <p class="text-orange-500 font-semibold text-sm mb-2">
                  Operations Manager
                </p>
                <p class="text-gray-500 text-sm mb-4">
                  Logistics expert ensuring your food arrives hot and fresh. Previously
                  managed supply chains for top delivery platforms.
                </p>
                <div class="flex justify-center gap-3">
                  <a
                    href="mailto:sarah@durian.com"
                    class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    ✉️
                  </a>
                  <a
                    href="#"
                    class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    📘
                  </a>
                  <a
                    href="#"
                    class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    💬
                  </a>
                </div>
              </div>
            </div>

            <!-- Marketing Lead Profile -->
            <div
              class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
            >
              <div
                class="relative h-64 overflow-hidden bg-gradient-to-br from-orange-100 to-rose-100"
              >
                <img
                  src="/images/team/marketing-david.jpg"
                  alt="David Kim"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="p-5 text-center">
                <h3 class="text-xl font-bold text-gray-800">David Kim</h3>
                <p class="text-orange-500 font-semibold text-sm mb-2">Marketing Lead</p>
                <p class="text-gray-500 text-sm mb-4">
                  Creative storyteller and brand strategist. Loves crafting campaigns that
                  connect food lovers with unforgettable experiences.
                </p>
                <div class="flex justify-center gap-3">
                  <a
                    href="mailto:david@durian.com"
                    class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    ✉️
                  </a>
                  <a
                    href="#"
                    class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    📘
                  </a>
                  <a
                    href="#"
                    class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    💬
                  </a>
                </div>
              </div>
            </div>

            <!-- Customer Support Profile -->
            <div
              class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
            >
              <div
                class="relative h-64 overflow-hidden bg-gradient-to-br from-orange-100 to-rose-100"
              >
                <img
                  src="/images/team/support-emma.jpg"
                  alt="Emma Watson"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="p-5 text-center">
                <h3 class="text-xl font-bold text-gray-800">Emma Watson</h3>
                <p class="text-orange-500 font-semibold text-sm mb-2">
                  Customer Happiness Lead
                </p>
                <p class="text-gray-500 text-sm mb-4">
                  Ensuring every customer leaves with a smile. Previously led support
                  teams at top hospitality brands.
                </p>
                <div class="flex justify-center gap-3">
                  <a
                    href="mailto:emma@durian.com"
                    class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    ✉️
                  </a>
                  <a
                    href="#"
                    class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    📘
                  </a>
                  <a
                    href="#"
                    class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    💬
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Developer Section - Featured Profile Card -->
        <div
          class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
        >
          <div class="grid md:grid-cols-3 gap-0">
            <!-- Left Sidebar with Background Image -->
            <div
              class="md:col-span-1 h-80 md:h-auto relative flex items-center justify-center p-6 overflow-hidden"
            >
              <!-- Background Image -->
              <div
                class="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style="background-image: url('/images/developer/laravel.png')"
              ></div>

              <!-- Dark Overlay for Readability -->
              <div
                class="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-black/60"
              ></div>

              <!-- Profile Picture -->
              <div
                class="relative w-48 h-48 rounded-full overflow-hidden border-4 border-orange-400 shadow-2xl z-10"
              >
                <img
                  src="/images/developer/rithy.png"
                  alt="Rithy - Developer"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>

            <!-- Right Content Area -->
            <div class="md:col-span-2 p-6 md:p-8 flex flex-col justify-center">
              <div class="mb-2">
                <span
                  class="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full"
                  >Full Stack Developer</span
                >
              </div>
              <h2 class="text-3xl font-bold text-gray-800 mb-1">Rithy</h2>
              <p class="text-gray-500 mb-4">Nuxt & Tailwind Expert | Foodie Enthusiast</p>

              <p class="text-gray-600 leading-relaxed mb-6">
                Rithy built this website from scratch using <strong>Nuxt 4</strong> and
                <strong>Tailwind CSS 4</strong>. With over 6 years of experience in
                frontend development, he specializes in creating fast, responsive, and
                visually stunning web experiences. Passionate about clean code and great
                UI.
              </p>

              <!-- Updated Social Links - Using clean SVG icons (modern & consistent with your Durian logo style) -->
              <div class="flex flex-wrap gap-4">
                <!-- Email -->
                <a
                  href="mailto:rithy@durian.com"
                  class="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-full hover:bg-orange-500 hover:text-white transition-all duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 8l7.89 5.26a2.01 2.01 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2"
                    />
                  </svg>
                  Email
                </a>

                <!-- Facebook -->
                <a
                  href="#"
                  class="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-full hover:bg-orange-500 hover:text-white transition-all duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
                    />
                  </svg>
                  Facebook
                </a>

                <!-- Telegram (Fixed & Clean) -->
                <a
                  href="#"
                  class="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-full hover:bg-orange-500 hover:text-white transition-all duration-300"
                >
                  
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"><path fill="#229ED9" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.93 7.36l-1.6 7.56c-.12.54-.44.67-.89.42l-2.46-1.81-1.19 1.15c-.13.13-.24.24-.5.24l.18-2.53 4.61-4.16c.2-.18-.04-.28-.31-.1l-5.7 3.59-2.45-.77c-.53-.16-.54-.53.11-.78l9.58-3.7c.45-.17.85.11.7.77z"/></svg>
                  Telegram
                </a>

                <!-- GitHub -->
                <a
                  href="#"
                  class="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-full hover:bg-orange-500 hover:text-white transition-all duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577 0-.285-.01-1.044-.015-2.051-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .32.192.694.8.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z"
                    />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "public",
  title: "About",
});

useHead({
  title: "About Us - Durian",
  meta: [
    {
      name: "description",
      content:
        "Learn about Durian’s story, mission, and values. Meet our team and the developer behind this website.",
    },
  ],
});
</script>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}
.animation-delay-200 {
  animation-delay: 0.2s;
}
</style>
