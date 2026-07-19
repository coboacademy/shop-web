import axios from 'axios'

export const useApi = () => {
  const config = useRuntimeConfig()

  const api = axios.create({
    baseURL: config.public.apiBase,
    headers: {
      Accept: 'application/json',
    },
  })

  const token = process.client ? localStorage.getItem('auth_token') : null

  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  return api
}