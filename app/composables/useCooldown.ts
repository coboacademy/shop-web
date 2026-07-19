export const useCooldown = (defaultSeconds = 60) => {
  const secondsLeft = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  const isCoolingDown = computed(() => secondsLeft.value > 0)

  const start = (seconds = defaultSeconds) => {
    secondsLeft.value = seconds

    if (timer) {
      clearInterval(timer)
      timer = null
    }

    timer = setInterval(() => {
      if (secondsLeft.value <= 1) {
        secondsLeft.value = 0

        if (timer) {
          clearInterval(timer)
          timer = null
        }

        return
      }

      secondsLeft.value--
    }, 1000)
  }

  const stop = () => {
    secondsLeft.value = 0

    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onBeforeUnmount(() => {
    if (timer) {
      clearInterval(timer)
    }
  })

  return {
    secondsLeft,
    isCoolingDown,
    start,
    stop,
  }
}