import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: 'system' as ThemeMode,
    systemDark: false,
    initialized: false,
  }),

  getters: {
    isDark: (state): boolean => {
      if (state.mode === 'dark') return true
      if (state.mode === 'light') return false

      return state.systemDark
    },

    currentTheme: (state): 'light' | 'dark' => {
      if (state.mode === 'dark') return 'dark'
      if (state.mode === 'light') return 'light'

      return state.systemDark ? 'dark' : 'light'
    },
  },

  actions: {
    initTheme() {
      if (!import.meta.client) return

      const saved = localStorage.getItem('theme_mode') as ThemeMode | null

      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        this.mode = saved
      }

      this.systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches

      this.applyTheme()
      this.watchSystemTheme()

      this.initialized = true
    },

    setTheme(mode: ThemeMode) {
      this.mode = mode

      if (import.meta.client) {
        localStorage.setItem('theme_mode', mode)
      }

      this.applyTheme()
    },

    toggleTheme() {
      this.setTheme(this.isDark ? 'light' : 'dark')
    },

    applyTheme() {
      if (!import.meta.client) return

      const html = document.documentElement
      const dark = this.mode === 'dark' || (this.mode === 'system' && this.systemDark)

      html.classList.remove('light', 'dark')
      html.classList.add(dark ? 'dark' : 'light')

      html.style.colorScheme = dark ? 'dark' : 'light'
      html.setAttribute('data-theme', dark ? 'dark' : 'light')
    },

    watchSystemTheme() {
      if (!import.meta.client) return

      const media = window.matchMedia('(prefers-color-scheme: dark)')

      const handleChange = (event: MediaQueryListEvent) => {
        this.systemDark = event.matches

        if (this.mode === 'system') {
          this.applyTheme()
        }
      }

      media.removeEventListener('change', handleChange)
      media.addEventListener('change', handleChange)
    },
  },
})