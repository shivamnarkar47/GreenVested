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

  // Portfolio CRUD APIs
  getPortfolios: async () => {
    const { data } = await apiClient.get('/portfolios')
    return data
  },

  createPortfolio: async (portfolio: any) => {
    const { data } = await apiClient.post('/portfolios', portfolio)
    return data
  },

  getPortfolio: async (id: number) => {
    const { data } = await apiClient.get(`/portfolios/${id}`)
    return data
  },

  updatePortfolio: async (id: number, portfolio: any) => {
    const { data } = await apiClient.put(`/portfolios/${id}`, portfolio)
    return data
  },

  deletePortfolio: async (id: number) => {
    const { data } = await apiClient.delete(`/portfolios/${id}`)
    return data
  },

  healthCheck: async () => {
    const { data } = await apiClient.get('/health')
    return data
  },

  // GIS APIs
  getGISStates: async () => {
    const { data } = await apiClient.get('/gis/states')
    return data
  },

  getGISHeatmap: async () => {
    const { data } = await apiClient.get('/gis/heatmap')
    return data
  },

  getGISCompanyLocations: async () => {
    const { data } = await apiClient.get('/gis/companies/location')
    return data
  },

  getGISEnvironmentalData: async (state: string) => {
    const { data } = await apiClient.get(`/gis/environmental/${state}`)
    return data
  },

  getGISClimateRiskZones: async (state?: string) => {
    const params = state ? `?state=${state}` : ''
    const { data } = await apiClient.get(`/gis/climate-risk${params}`)
    return data
  },

  getGISRegionalComparison: async () => {
    const { data } = await apiClient.get('/gis/regional-comparison')
    return data
  }
}

export default apiClient
