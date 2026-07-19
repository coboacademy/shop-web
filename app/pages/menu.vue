<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-r from-orange-600 to-rose-600 py-16 overflow-hidden">
      <div class="absolute inset-0 opacity-20">
        <div class="absolute top-0 left-0 w-64 h-64 bg-white rounded-full filter blur-3xl animate-pulse"></div>
        <div class="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up">
          Our <span class="border-b-4 border-yellow-300">Menu</span>
        </h1>
        <p class="text-orange-100 text-lg max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
          Explore our handcrafted dishes made with the freshest ingredients. Something delicious for every craving.
        </p>
      </div>
    </section>

    <!-- Menu Filters & Search + Cart Button -->
    <section class="py-8 bg-white shadow-md sticky top-[72px] z-40">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <!-- Category Tabs -->
          <div class="flex flex-wrap justify-center gap-2">
            <button
              v-for="cat in categories"
              :key="cat"
              @click="activeCategory = cat"
              :class="[
                'px-5 py-2 rounded-full font-medium transition-all duration-300',
                activeCategory === cat
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              ]"
            >
              {{ cat }}
            </button>
          </div>

          <div class="flex items-center gap-3">
            <!-- Search Box -->
            <div class="relative w-full md:w-72">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search dishes..."
                class="w-full px-4 py-2 pl-10 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <!-- Cart Button (fixed badge) -->
            <button @click="toggleCart" class="relative p-2 text-gray-700 hover:text-orange-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M12 15v6" />
              </svg>
              <!-- Use cartStore.totalItems instead of undefined cartItemsCount -->
              <span v-if="cartStore.totalItems > 0" class="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {{ cartStore.totalItems }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Menu Grid -->
    <section class="py-12">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div v-if="filteredDishes.length === 0" class="text-center py-20">
          <div class="text-6xl mb-4">🍽️</div>
          <h3 class="text-2xl font-semibold text-gray-700">No dishes found</h3>
          <p class="text-gray-500 mt-2">Try adjusting your search or category filter.</p>
        </div>

        <!-- Dishes Grid - Enhanced Card Style -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <div
            v-for="dish in filteredDishes"
            :key="dish.id"
            class="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:bg-gradient-to-b hover:from-white hover:to-orange-50"
          >
            <div class="relative overflow-hidden h-56">
              <img
                :src="dish.image"
                :alt="dish.name"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-bold text-orange-600 shadow-md">
                ★ {{ dish.rating }}
              </div>
              <div v-if="dish.isVegetarian" class="absolute bottom-4 left-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <span>🌱</span> Veg
              </div>
              <!-- Discount badge -->
              <div v-if="dish.oldPrice" class="absolute top-4 left-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                -{{ Math.round(((dish.oldPrice - dish.price) / dish.oldPrice) * 100) }}%
              </div>
            </div>
            <div class="p-5">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{{ dish.name }}</h3>
                <span class="text-sm text-gray-500">{{ dish.category }}</span>
              </div>
              <p class="text-gray-500 text-sm mb-3 line-clamp-2">
                {{ dish.description }}
              </p>
              <div class="flex justify-between items-center mt-4">
                <div>
                  <span class="text-2xl font-bold text-orange-600">${{ dish.price }}</span>
                  <span v-if="dish.oldPrice" class="text-sm text-gray-400 line-through ml-2">${{ dish.oldPrice }}</span>
                </div>
                <button
                  @click="addToCartWithToast(dish)"
                  class="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Cart Sidebar (unchanged, works with store) -->
    <Transition name="slide">
      <div v-if="cartVisible" class="fixed inset-0 z-50 overflow-hidden">
        <div class="absolute inset-0 bg-gray-500 bg-opacity-75" @click="toggleCart"></div>
        <div class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
          <div class="p-4 border-b bg-gradient-to-r from-orange-500 to-rose-500 text-white flex justify-between">
            <h2 class="text-xl font-bold">Your Cart ({{ cartStore.totalItems }})</h2>
            <button @click="toggleCart">✕</button>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <div v-if="cartStore.items.length === 0" class="text-center py-12">
              <div class="text-6xl mb-4">🛒</div>
              <p>Your cart is empty</p>
            </div>
            <div v-else class="space-y-4">
              <div v-for="item in cartStore.items" :key="item.id" class="flex gap-4 border-b pb-4">
                <img :src="item.image" class="w-20 h-20 rounded-lg object-cover" />
                <div class="flex-1">
                  <h4 class="font-semibold">{{ item.name }}</h4>
                  <p class="text-orange-600 font-bold">${{ item.price }}</p>
                  <div class="flex items-center gap-2 mt-2">
                    <button @click="cartStore.updateQuantity(item.id, -1)" class="w-6 h-6 rounded-full bg-gray-200">-</button>
                    <span>{{ item.quantity }}</span>
                    <button @click="cartStore.updateQuantity(item.id, 1)" class="w-6 h-6 rounded-full bg-gray-200">+</button>
                    <button @click="cartStore.removeItem(item.id)" class="ml-auto text-red-500 text-sm">Remove</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="border-t p-4 bg-gray-50">
            <div class="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>${{ cartStore.subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm text-gray-500">
              <span>Delivery Fee</span>
              <span>${{ cartStore.deliveryFee.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold mt-2">
              <span>Total</span>
              <span class="text-orange-600">${{ cartStore.total.toFixed(2) }}</span>
            </div>
            <NuxtLink to="/checkout" @click="toggleCart" class="block w-full mt-4 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full text-center font-semibold">
              Proceed to Checkout
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Toast Notification (Alert) -->
    <Transition name="toast">
      <div v-if="toastMessage" class="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2">
        <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useCartStore } from "~/stores/cart";

const cartStore = useCartStore();
const cartVisible = ref(false);
const toastMessage = ref("");
let toastTimeout = null;

// Load cart from localStorage on mount
if (process.client) {
  cartStore.loadFromLocalStorage();
}

const toggleCart = () => {
  cartVisible.value = !cartVisible.value;
};

// Show toast alert when adding to cart
const addToCartWithToast = (dish) => {
  cartStore.addItem(dish);
  toastMessage.value = `${dish.name} added to cart!`;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastMessage.value = "";
  }, 2000);
};

// Category and search
const categories = ["All", "Burgers", "Pizza", "Sushi", "Pasta", "Salads", "Desserts"];

const activeCategory = ref("All");
const searchQuery = ref("");

// Expanded Menu data (original 2 + 20 new = 32 dishes)
const dishes = ref([
  {
    id: 1,
    name: "Classic Cheeseburger",
    category: "Burgers",
    price: 12.99,
    oldPrice: null,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
    description: "Juicy beef patty with melted cheddar, fresh lettuce, tomato, and special sauce.",
    isVegetarian: false,
  },
  {
    id: 2,
    name: "Margherita Pizza",
    category: "Pizza",
    price: 16.49,
    oldPrice: 19.99,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop",
    description: "Wood-fired crust, fresh mozzarella, basil, and San Marzano tomato sauce.",
    isVegetarian: true,
  },
  {
    id: 3,
    name: "BBQ Bacon Burger",
    category: "Burgers",
    price: 14.99,
    oldPrice: null,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop",
    description: "Smoky BBQ sauce, crispy bacon, cheddar, onion rings, and juicy beef patty.",
    isVegetarian: false,
  },
  {
    id: 4,
    name: "Pepperoni Feast Pizza",
    category: "Pizza",
    price: 18.99,
    oldPrice: 21.99,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=400&fit=crop",
    description: "Loaded with pepperoni, mozzarella, and tangy tomato sauce on a crispy crust.",
    isVegetarian: false,
  },
  {
    id: 5,
    name: "Spicy Tuna Roll",
    category: "Sushi",
    price: 13.49,
    oldPrice: null,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&h=400&fit=crop",
    description: "Fresh tuna with spicy mayo, avocado, and cucumber wrapped in nori and rice.",
    isVegetarian: false,
  },
  {
    id: 6,
    name: "California Roll",
    category: "Sushi",
    price: 11.99,
    oldPrice: null,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&h=400&fit=crop",
    description: "Crab, avocado, cucumber, and sesame seeds in a classic roll.",
    isVegetarian: false,
  },
  {
    id: 7,
    name: "Creamy Carbonara Pasta",
    category: "Pasta",
    price: 15.99,
    oldPrice: null,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=600&h=400&fit=crop",
    description: "Silky egg sauce with pancetta, parmesan, and fresh black pepper.",
    isVegetarian: false,
  },
  {
    id: 8,
    name: "Pesto Penne Pasta",
    category: "Pasta",
    price: 14.49,
    oldPrice: null,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&h=400&fit=crop",
    description: "Fresh basil pesto, cherry tomatoes, and toasted pine nuts.",
    isVegetarian: true,
  },
  {
    id: 9,
    name: "Classic Caesar Salad",
    category: "Salads",
    price: 10.99,
    oldPrice: null,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&h=400&fit=crop",
    description: "Crisp romaine, parmesan, croutons, and creamy Caesar dressing.",
    isVegetarian: true,
  },
  {
    id: 10,
    name: "Greek Salad",
    category: "Salads",
    price: 12.49,
    oldPrice: null,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop",
    description: "Cucumbers, tomatoes, olives, feta cheese, and red onions with olive oil.",
    isVegetarian: true,
  },
  {
    id: 11,
    name: "Chocolate Lava Cake",
    category: "Desserts",
    price: 8.99,
    oldPrice: null,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&h=400&fit=crop",
    description: "Warm chocolate cake with a molten center, served with vanilla ice cream.",
    isVegetarian: true,
  },
  {
    id: 12,
    name: "New York Cheesecake",
    category: "Desserts",
    price: 7.99,
    oldPrice: 9.49,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&h=400&fit=crop",
    description: "Rich and creamy cheesecake with a graham cracker crust.",
    isVegetarian: true,
  },
  {
    id: 13,
    name: "Avocado Bacon Burger",
    category: "Burgers",
    price: 15.49,
    oldPrice: null,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1596662951480-3c3c3c3c3c3c?w=600&h=400&fit=crop", // placeholder style, replace if needed
    description: "Beef patty topped with fresh avocado, crispy bacon, and chipotle mayo.",
    isVegetarian: false,
  },
  {
    id: 14,
    name: "Truffle Margherita Pizza",
    category: "Pizza",
    price: 19.99,
    oldPrice: null,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&h=400&fit=crop",
    description: "Classic margherita with aromatic truffle oil drizzle.",
    isVegetarian: true,
  },
  {
    id: 15,
    name: "Salmon Avocado Sushi",
    category: "Sushi",
    price: 14.99,
    oldPrice: null,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=600&h=400&fit=crop",
    description: "Fresh salmon, avocado, and cucumber in a premium roll.",
    isVegetarian: false,
  },
  {
    id: 16,
    name: "Vegetarian Dragon Roll",
    category: "Sushi",
    price: 12.99,
    oldPrice: null,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1579871494447-2a5f2a5e0f3e?w=600&h=400&fit=crop",
    description: "Crispy tempura vegetables, avocado, and sweet eel sauce (veg version).",
    isVegetarian: true,
  },
  {
    id: 17,
    name: "Spaghetti Bolognese",
    category: "Pasta",
    price: 16.99,
    oldPrice: null,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=600&h=400&fit=crop",
    description: "Rich meat sauce slow-cooked with herbs and parmesan.",
    isVegetarian: false,
  },
  {
    id: 18,
    name: "Quinoa Avocado Salad",
    category: "Salads",
    price: 11.99,
    oldPrice: null,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop",
    description: "Quinoa, avocado, cherry tomatoes, cucumber, and lemon tahini dressing.",
    isVegetarian: true,
  },
  {
    id: 19,
    name: "Tiramisu",
    category: "Desserts",
    price: 8.49,
    oldPrice: null,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop",
    description: "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone.",
    isVegetarian: true,
  },
  {
    id: 20,
    name: "Mango Sticky Rice",
    category: "Desserts",
    price: 7.99,
    oldPrice: null,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=400&fit=crop",
    description: "Sweet coconut sticky rice served with fresh ripe mango.",
    isVegetarian: true,
  },
  {
    id: 21,
    name: "Crispy Chicken Burger",
    category: "Burgers",
    price: 13.99,
    oldPrice: null,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
    description: "Buttermilk fried chicken, pickles, slaw, and spicy mayo.",
    isVegetarian: false,
  },
  {
    id: 22,
    name: "Four Cheese Pizza",
    category: "Pizza",
    price: 17.49,
    oldPrice: null,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop",
    description: "Mozzarella, gorgonzola, parmesan, and ricotta on a thin crust.",
    isVegetarian: true,
  }
]);

const filteredDishes = computed(() => {
  let filtered = dishes.value;
  if (activeCategory.value !== "All") {
    filtered = filtered.filter((dish) => dish.category === activeCategory.value);
  }
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (dish) =>
        dish.name.toLowerCase().includes(query) ||
        dish.description.toLowerCase().includes(query)
    );
  }
  return filtered;
});

useHead({
  title: "Our Menu - Durian",
});
</script>

<style scoped>
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
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(100%);
}
.slide-enter-to, .slide-leave-from {
  transform: translateX(0);
}
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>