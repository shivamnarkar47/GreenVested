import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export const api = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password })
    return data
  },
  
  register: async (email: string, password: string, fullName?: string) => {
    const { data } = await apiClient.post('/auth/register', { email, password, full_name: fullName })
    return data
  },
  
  getMe: async () => {
    const { data } = await apiClient.get('/auth/me')
    return data
  },
  
  getCompany: async (bseCode: string) => {
    const { data } = await apiClient.get(`/companies/${bseCode}`)
    return data
  },
  
  getScore: async (bseCode: string) => {
    const { data } = await apiClient.get(`/scores/${bseCode}`)
    return data
  },
  
  getLeaderboard: async (sector?: string, limit: number = 50) => {
    const params = new URLSearchParams()
    if (sector) params.append('sector', sector)
    params.append('limit', limit.toString())
    const { data } = await apiClient.get(`/leaderboard?${params}`)
    return data
  },
  
  analyzeCompany: async (bseCode: string) => {
    const { data } = await apiClient.post(`/analyze/${bseCode}`)
    return data
  },
  
  analyzePortfolio: async (holdings: any[]) => {
    const { data } = await apiClient.post('/portfolio/analyze', holdings)
    return data
  },
  
  healthCheck: async () => {
    const { data } = await apiClient.get('/health')
    return data
  }
}

export default apiClient
