import { isCacheFresh, makeCacheKey } from '~/utils/cache'

export const useCachedRequest = () => {
  const appCache = useAppCacheStore()

  const cachedRequest = async <T>(options: {
    module: string
    filters?: Record<string, any>
    ttl?: number
    force?: boolean
    request: () => Promise<T>
    onCached?: (data: T) => void
    onFresh?: (data: T) => void
  }) => {
    const ttl = options.ttl ?? 1000 * 60 * 5
    const filters = options.filters ?? {}
    const key = makeCacheKey(options.module, filters)

    const cached = appCache.get<T>(key)

    if (cached && !options.force) {
      options.onCached?.(cached.data)

      if (isCacheFresh(cached.savedAt, ttl)) {
        return {
          data: cached.data,
          fromCache: true,
          refreshed: false,
        }
      }
    }

    const freshData = await options.request()

    appCache.set(key, freshData)

    options.onFresh?.(freshData)

    return {
      data: freshData,
      fromCache: false,
      refreshed: true,
    }
  }

  return {
    cachedRequest,
  }
}