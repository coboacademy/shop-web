export default defineNuxtPlugin((nuxtApp) => {
  const loadingStore = useLoadingStore()

  nuxtApp.hook('page:start', () => {
    loadingStore.start()
  })

  nuxtApp.hook('page:finish', () => {
    loadingStore.finish()
  })

  nuxtApp.hook('app:error', () => {
    loadingStore.fail()
  })
})