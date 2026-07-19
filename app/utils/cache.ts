export interface CacheEntry<T> {
  data: T
  savedAt: number
}

export const makeCacheKey = (
  module: string,
  filters: Record<string, any> = {}
) => {
  const cleanFilters = Object.keys(filters)
    .sort()
    .reduce((result, key) => {
      result[key] = filters[key] ?? ''
      return result
    }, {} as Record<string, any>)

  return `${module}:${JSON.stringify(cleanFilters)}`
}

export const isCacheFresh = (savedAt: number, ttl: number) => {
  return Date.now() - savedAt < ttl
}