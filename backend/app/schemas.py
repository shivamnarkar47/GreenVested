from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


# User schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Company schemas
class CompanyBase(BaseModel):
    bse_code: str
    nse_code: Optional[str] = None
    company_name: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = None
    headquarters: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None


class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CompanyCreate(CompanyBase):
    pass


# ESG Score schemas
class ESGScoreResponse(BaseModel):
    id: int
    company_id: int
    environmental_score: Optional[float] = None
    social_score: Optional[float] = None
    governance_score: Optional[float] = None
    esg_score: Optional[float] = None
    predicted_return: Optional[float] = None
    benchmark_vs_nifty50: Optional[float] = None
    confidence_score: Optional[float] = None
    sentiment_summary: Optional[str] = None
    key_insights: Optional[List[Dict[str, Any]]] = None
    analysis_date: Optional[datetime] = None
    source: Optional[str] = None

    class Config:
        from_attributes = True


class CompanyWithScore(BaseModel):
    bse_code: str
    company_name: str
    sector: Optional[str]
    esg_score: Optional[float]
    e_score: Optional[float]
    s_score: Optional[float]
    g_score: Optional[float]
    predicted_return: Optional[float]
    benchmark_vs_nifty50: Optional[float]

    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    data: List[CompanyWithScore]
    total: int


# Portfolio schemas
class PortfolioItemCreate(BaseModel):
    bse_code: str
    shares: float
    avg_cost: float


class PortfolioItemResponse(BaseModel):
    id: int
    company_id: int
    bse_code: str
    company_name: str
    shares: float
    avg_cost: float
    current_value: Optional[float] = None

    class Config:
        from_attributes = True


class PortfolioCreate(BaseModel):
    name: str
    description: Optional[str] = None
    items: List[PortfolioItemCreate]


class PortfolioResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    total_value: float
    created_at: datetime
    items: List[PortfolioItemResponse]

    class Config:
        from_attributes = True


# Portfolio Analysis
class PortfolioMetrics(BaseModel):
    expected_return: float
    volatility: float
    sharpe_ratio: float
    var_95: float
    esg_adjusted_return: float


class BenchmarkComparison(BaseModel):
    benchmark_return: float
    portfolio_return: float
    excess_return: float
    alpha: float
    outperformance: bool


class MonteCarloResult(BaseModel):
    mean_return: float
    std_dev: float
    min_return: float
    max_return: float
    percentile_5: float
    percentile_95: float
    prob_positive: float
    simulation_data: list = []


class PortfolioAnalysisResponse(BaseModel):
    metrics: PortfolioMetrics
    benchmark_comparison: BenchmarkComparison
    monte_carlo: MonteCarloResult


# Analysis
class AnalysisRequest(BaseModel):
    bse_code: str


class AnalysisResponse(BaseModel):
    status: str
    bse_code: str
    message: str


# Health
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    database: str
    nlp: str
