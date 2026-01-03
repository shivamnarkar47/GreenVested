export interface Company {
  id: number
  bse_code: string
  nse_code?: string
  company_name: string
  sector?: string
  industry?: string
  market_cap?: number
  headquarters?: string
  website?: string
  description?: string
  created_at: string
}

export interface ESGScore {
  id: number
  company_id: number
  environmental_score?: number
  social_score?: number
  governance_score?: number
  esg_score?: number
  predicted_return?: number
  benchmark_vs_nifty50?: number
  confidence_score?: number
  sentiment_summary?: string
  key_insights?: ESGInsight[]
  analysis_date?: string
  source?: string
}

export interface ESGInsight {
  quote: string
  category: 'environmental' | 'social' | 'governance'
  impact: 'high' | 'medium' | 'low'
}

export interface CompanyWithScore {
  bse_code: string
  company_name: string
  sector?: string
  esg_score?: number
  e_score?: number
  s_score?: number
  g_score?: number
  predicted_return?: number
  benchmark_vs_nifty50?: number
}

export interface LeaderboardResponse {
  data: CompanyWithScore[]
  total: number
}

export interface User {
  id: number
  email: string
  full_name?: string
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface Holding {
  bse_code: string
  company_name: string
  shares: number
  avg_cost: number
  esg_score?: number
}

export interface PortfolioMetrics {
  expected_return: number
  volatility: number
  sharpe_ratio: number
  var_95: number
  esg_adjusted_return: number
}

export interface BenchmarkComparison {
  benchmark_return: number
  portfolio_return: number
  excess_return: number
  alpha: number
  outperformance: boolean
}

export interface MonteCarloResult {
  mean_return: number
  std_dev: number
  min_return: number
  max_return: number
  percentile_5: number
  percentile_95: number
  prob_positive: number
  esg_bonus_applied?: number
}

export interface PortfolioAnalysisResponse {
  metrics: PortfolioMetrics
  benchmark_comparison: BenchmarkComparison
  monte_carlo: MonteCarloResult
}

export interface HealthResponse {
  status: string
  timestamp: string
  database: string
  nlp: string
}
