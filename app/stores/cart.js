import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] // each item: { id, name, price, quantity, image, ... }
  }),
  
  getters: {
    totalItems: (state) => {
      return state.items.reduce((sum, item) => sum + item.quantity, 0)
    },
    
    subtotal: (state) => {
      return state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    },
    
    deliveryFee: (state) => {
      return state.items.length > 0 ? 2.99 : 0
    },
    
    tax: (state) => {
      return state.subtotal * 0.1
    },
    
    total: (state) => {
      return state.subtotal + state.deliveryFee + state.tax
    },
    
    // For checkout page
    cartSummary: (state) => {
      return {
        items: state.items,
        subtotal: state.subtotal,
        deliveryFee: state.deliveryFee,
        tax: state.tax,
        total: state.total
      }
    }
  },
  
  actions: {
    addItem(dish) {
      const existing = this.items.find(item => item.id === dish.id)
      if (existing) {
        existing.quantity++
      } else {
        this.items.push({ ...dish, quantity: 1 })
      }
      this.saveToLocalStorage()
    },
    
    removeItem(id) {
      this.items = this.items.filter(item => item.id !== id)
      this.saveToLocalStorage()
    },
    
    updateQuantity(id, delta) {
      const item = this.items.find(item => item.id === id)
      if (item) {
        const newQty = item.quantity + delta
        if (newQty <= 0) {
          this.removeItem(id)
        } else {
          item.quantity = newQty
        }
        this.saveToLocalStorage()
      }
    },
    
    clearCart() {
      this.items = []
      this.saveToLocalStorage()
    },
    
    // Load from localStorage on client
    loadFromLocalStorage() {
      if (process.client) {
        const saved = localStorage.getItem('durian_cart')
        if (saved) {
          this.items = JSON.parse(saved)
        }
      }
    },
    
    saveToLocalStorage() {
      if (process.client) {
        localStorage.setItem('durian_cart', JSON.stringify(this.items))
      }
    },
    
    // For reorder: replace current cart with items from an order
    setCartFromOrder(orderItems) {
      this.items = orderItems.map(item => ({ ...item }))
      this.saveToLocalStorage()
    }
  }
})