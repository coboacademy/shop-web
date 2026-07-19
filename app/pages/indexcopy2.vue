<template>
  <div class="min-h-screen bg-white selection:bg-orange-100 selection:text-orange-600">
    
    <section class="relative overflow-hidden bg-gradient-to-b from-orange-50/50 via-white to-white pb-20 pt-10">
      <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-24 -left-24 w-96 h-96 bg-green-100/40 rounded-full blur-3xl animate-blob"></div>
        <div class="absolute top-1/2 -right-24 w-80 h-80 bg-rose-100/40 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div class="absolute -bottom-24 left-1/3 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div class="container mx-auto px-6 relative z-10">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          
          <div class="text-center lg:text-left space-y-8 animate-fade-in-up">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-orange-100 text-orange-600 text-sm font-bold animate-bounce-slow">
              <span class="flex h-2 w-2 rounded-full bg-orange-500 animate-ping"></span>
              🔥 20% OFF FIRST ORDER
            </div>
            
            <h1 class="text-6xl md:text-7xl lg:text-8xl font-black leading-[1.1] text-gray-900 tracking-tight">
              Taste the <br />
              <span class="relative inline-block">
                <span class="relative z-10 bg-gradient-to-r from-orange-500 via-rose-500 to-orange-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">Magic</span>
                <svg class="absolute -bottom-2 left-0 w-full h-4 text-orange-200/60 z-0" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 25 0 50 5 T 100 5" stroke="currentColor" stroke-width="4" fill="transparent"/></svg>
              </span>
              <br />of Fresh Food
            </h1>

            <p class="text-xl text-gray-500 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Handcrafted dishes made with love. We don't just deliver food; we deliver <span class="text-gray-900 font-semibold underline decoration-green-400 decoration-2">happiness</span>.
            </p>

            <div class="flex flex-wrap gap-4 justify-center lg:justify-start">
              <nuxt-link to="/orders" class="group px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-gray-900/20 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center gap-3">
                Order Now
                <div class="bg-orange-500 rounded-lg p-1 group-hover:rotate-12 transition-transform">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </div>
              </nuxt-link>
              
              <button class="px-8 py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-50 hover:border-orange-200 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center gap-3">
                <span class="flex h-10 w-10 items-center justify-center bg-orange-100 rounded-xl text-orange-600">▶</span>
                Watch Video
              </button>
            </div>
          </div>

          <div class="relative flex justify-center items-center">
            <div class="relative w-full max-w-[500px] animate-float">
              <div class="absolute inset-0 border-2 border-dashed border-orange-200 rounded-full animate-[spin_20s_linear_infinite]"></div>
              
              <div class="relative p-4">
                <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=800&fit=crop" 
                  alt="Food" 
                  class="rounded-[60px] object-cover w-full aspect-square shadow-2xl border-[12px] border-white" />
                
                <div class="absolute -top-4 -right-4 bg-green-500 text-white font-black px-6 py-4 rounded-3xl shadow-lg rotate-12 hover:rotate-0 transition-transform cursor-pointer group">
                  <p class="text-xs uppercase tracking-widest">Organic</p>
                  <p class="text-xl">100% FRESH</p>
                </div>

                <div class="absolute -bottom-6 -left-6 bg-white p-4 rounded-[32px] shadow-2xl flex items-center gap-4 animate-bounce-slow">
                  <div class="bg-orange-100 p-3 rounded-2xl text-2xl">⭐</div>
                  <div>
                    <p class="font-black text-gray-900 leading-tight">4.9/5</p>
                    <p class="text-xs text-gray-500 font-bold uppercase">Top Rated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <section class="py-24 bg-white">
      <div class="container mx-auto px-6">
        <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div class="space-y-4 text-center md:text-left">
            <span class="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-xl text-xs font-black uppercase tracking-[0.2em]">Our Bestsellers</span>
            <h2 class="text-5xl font-black text-gray-900 tracking-tight">Signature <span class="text-orange-500">Delicacies</span></h2>
          </div>
          <nuxt-link to="/menu" class="text-orange-600 font-bold flex items-center gap-2 group">
            View Full Menu 
            <span class="bg-orange-50 w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all">→</span>
          </nuxt-link>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div v-for="(dish, index) in dishes" :key="index" 
            class="group bg-white rounded-[40px] p-4 border border-gray-100 hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-200/20 transition-all duration-500 transform hover:-translate-y-4">
            
            <div class="relative overflow-hidden rounded-[32px] aspect-square mb-6">
              <img :src="dish.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <button class="w-full py-3 bg-white text-gray-900 font-bold rounded-2xl translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  Quick Add +
                </button>
              </div>
              <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-gray-900">
                ★ {{ dish.rating }}
              </div>
            </div>

            <div class="px-2 space-y-2">
              <h3 class="text-xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">{{ dish.name }}</h3>
              <p class="text-gray-500 text-sm line-clamp-2 leading-relaxed font-medium">{{ dish.desc }}</p>
              <div class="flex justify-between items-center pt-4">
                <span class="text-2xl font-black text-gray-900">${{ dish.price }}</span>
                <button class="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all active:scale-90">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="container mx-auto px-6 py-10">
      <div class="bg-gray-900 rounded-[50px] p-8 md:p-16 relative overflow-hidden group">
        <div class="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-[120px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div class="text-center md:text-left space-y-4">
            <h2 class="text-4xl md:text-6xl font-black text-white tracking-tight">Weekend Special</h2>
            <p class="text-gray-400 text-lg max-w-md">Use code <span class="text-orange-500 font-mono font-bold tracking-widest">DURIANX30</span> for a massive discount!</p>
          </div>
          <button class="px-12 py-5 bg-orange-500 text-white font-black text-xl rounded-3xl shadow-xl shadow-orange-500/20 hover:bg-white hover:text-gray-900 hover:-rotate-2 transition-all duration-300">
            Grab 30% Off
          </button>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
const dishes = [
  { name: 'Double Lava Burger', price: '12.99', rating: '4.9', desc: 'Double beef, triple cheese, and our secret lava sauce.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=600&fit=crop' },
  { name: 'Garden Fresh Pizza', price: '16.49', rating: '4.8', desc: 'Hand-picked veggies on a wood-fired sourdough crust.', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=600&fit=crop' },
  { name: 'Salmon Sushi Zen', price: '21.99', rating: '4.9', desc: 'Premium grade salmon with freshly grated wasabi.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=600&fit=crop' },
  { name: 'Truffle Mac & Cheese', price: '14.99', rating: '4.7', desc: 'Decadent truffle oil paired with four artisanal cheeses.', image: 'https://images.unsplash.com/photo-1546833999-b9f581a4f7b6?w=600&h=600&fit=crop' }
];

definePageMeta({ layout: "default", title: "Home" });
</script>

<style scoped>
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

.animate-blob {
  animation: blob 7s infinite alternate ease-in-out;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-gradient {
  animation: gradient 3s linear infinite;
}

.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }

/* Tactile shadows for Play Style */
.shadow-2xl {
  shadow-color: rgba(249, 115, 22, 0.1);
}
</style>