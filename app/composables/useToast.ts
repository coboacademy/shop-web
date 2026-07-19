export const useToast = () => {
  const toastStore = useToastStore()

  return {
    items: computed(() => toastStore.items),

    success: (title: string, message?: string) => {
      toastStore.success(title, message)
    },

    error: (title: string, message?: string) => {
      toastStore.error(title, message)
    },

    info: (title: string, message?: string) => {
      toastStore.info(title, message)
    },

    warning: (title: string, message?: string) => {
      toastStore.warning(title, message)
    },

    remove: (id: number) => {
      toastStore.remove(id)
    },
  }
}