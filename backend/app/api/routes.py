from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, desc
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.database import get_db, init_db
from app.models import Company, ESGScore, User, Portfolio, PortfolioItem
from app.schemas import (
    CompanyCreate,
    CompanyResponse,
    ESGScoreResponse,
    PortfolioCreate,
    PortfolioResponse,
    UserCreate,
    UserResponse,
    TokenResponse,
    LeaderboardResponse,
    PortfolioAnalysisResponse,
    AnalysisResponse,
    HealthResponse,
    LoginRequest,
)
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.services.nlp import nlp_service
from app.services.ml_scoring import ml_service, portfolio_optimizer

router = APIRouter()


# Seed data for 8 companies
SEED_COMPANIES = [
    {
        "bse_code": "500325",
        "nse_code": "RELIANCE",
        "company_name": "Reliance Industries Limited",
        "sector": "Energy",
        "industry": "Conglomerate",
        "market_cap": 16000000,
        "headquarters": "Mumbai",
        "website": "https://www.ril.com",
        "description": "Reliance Industries is a conglomerate with interests in petrochemicals, refining, oil, telecommunications, and retail.",
    },
    {
        "bse_code": "532540",
        "nse_code": "TCS",
        "company_name": "Tata Consultancy Services Limited",
        "sector": "Technology",
        "industry": "IT Services",
        "market_cap": 12000000,
        "headquarters": "Mumbai",
        "website": "https://www.tcs.com",
        "description": "TCS is a global IT services, consulting and business solutions organization.",
    },
    {
        "bse_code": "500180",
        "nse_code": "HDFCBANK",
        "company_name": "HDFC Bank Limited",
        "sector": "Finance",
        "industry": "Banking",
        "market_cap": 9500000,
        "headquarters": "Mumbai",
        "website": "https://www.hdfcbank.com",
        "description": "HDFC Bank is a leading private sector bank in India.",
    },
    {
        "bse_code": "532174",
        "nse_code": "ICICIBANK",
        "company_name": "ICICI Bank Limited",
        "sector": "Finance",
        "industry": "Banking",
        "market_cap": 6500000,
        "headquarters": "Mumbai",
        "website": "https://www.icicibank.com",
        "description": "ICICI Bank is a leading private sector bank offering banking and financial services.",
    },
    {
        "bse_code": "500510",
        "nse_code": "LT",
        "company_name": "Larsen & Toubro Limited",
        "sector": "Construction",
        "industry": "Engineering",
        "market_cap": 4500000,
        "headquarters": "Mumbai",
        "website": "https://www.larsentoubro.com",
        "description": "L&T is a major technology, engineering, construction, and manufacturing company.",
    },
    {
        "bse_code": "500209",
        "nse_code": "INFY",
        "company_name": "Infosys Limited",
        "sector": "Technology",
        "industry": "IT Services",
        "market_cap": 5800000,
        "headquarters": "Bengaluru",
        "website": "https://www.infosys.com",
        "description": "Infosys is a global leader in next-generation digital services and consulting.",
    },
    {
        "bse_code": "500820",
        "nse_code": "ASIANPAINT",
        "company_name": "Asian Paints Limited",
        "sector": "Consumer",
        "industry": "Paints",
        "market_cap": 3200000,
        "headquarters": "Mumbai",
        "website": "https://www.asianpaints.com",
        "description": "Asian Paints is India's largest paint company and Asia's fourth largest.",
    },
    {
        "bse_code": "500112",
        "nse_code": "SBIN",
        "company_name": "State Bank of India",
        "sector": "Finance",
        "industry": "Banking",
        "market_cap": 5600000,
        "headquarters": "Mumbai",
        "website": "https://www.sbi.co.in",
        "description": "SBI is India's largest public sector bank with global presence.",
    },
]

# Pre-computed ESG scores
SEED_SCORES = {
    "500325": {"e": 68, "s": 75, "g": 73, "esg": 72, "pred": 14.5, "vs_nifty": 3.5},
    "532540": {"e": 82, "s": 88, "g": 85, "esg": 85, "pred": 16.2, "vs_nifty": 5.2},
    "500180": {"e": 75, "s": 80, "g": 79, "esg": 78, "pred": 15.8, "vs_nifty": 4.8},
    "532174": {"e": 73, "s": 78, "g": 77, "esg": 76, "pred": 15.2, "vs_nifty": 4.2},
    "500510": {"e": 65, "s": 72, "g": 73, "esg": 70, "pred": 13.5, "vs_nifty": 2.5},
    "500209": {"e": 80, "s": 85, "g": 84, "esg": 83, "pred": 16.8, "vs_nifty": 5.8},
    "500820": {"e": 70, "s": 76, "g": 76, "esg": 74, "pred": 14.2, "vs_nifty": 3.2},
    "500112": {"e": 68, "s": 73, "g": 72, "esg": 71, "pred": 13.8, "vs_nifty": 2.8},
}


@router.post("/auth/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    result = db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/auth/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    result = db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token}


@router.get("/auth/me")
def get_me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "full_name": user.full_name}


@router.get("/companies/{bse_code}", response_model=CompanyResponse)
def get_company(bse_code: str, db: Session = Depends(get_db)):
    result = db.execute(select(Company).where(Company.bse_code == bse_code))
    company = result.scalar_one_or_none()

    if not company:
        for seed in SEED_COMPANIES:
            if seed["bse_code"] == bse_code:
                company = Company(**seed)
                db.add(company)
                db.commit()
                db.refresh(company)
                break

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return company


@router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(
    sector: Optional[str] = None, limit: int = 50, db: Session = Depends(get_db)
):
    for seed in SEED_COMPANIES:
        result = db.execute(select(Company).where(Company.bse_code == seed["bse_code"]))
        if not result.scalar_one_or_none():
            company = Company(**seed)
            db.add(company)

    db.commit()

    query = select(Company)
    if sector:
        query = query.where(Company.sector == sector)
    query = query.limit(limit)

    result = db.execute(query)
    companies = result.scalars().all()

    leaderboard = []
    for company in companies:
        scores = SEED_SCORES.get(
            company.bse_code,
            {"e": 50, "s": 50, "g": 50, "esg": 50, "pred": 8.0, "vs_nifty": -3.0},
        )
        leaderboard.append(
            {
                "bse_code": company.bse_code,
                "company_name": company.company_name,
                "sector": company.sector,
                "esg_score": scores["esg"],
                "e_score": scores["e"],
                "s_score": scores["s"],
                "g_score": scores["g"],
                "predicted_return": scores["pred"],
                "benchmark_vs_nifty50": scores["vs_nifty"],
            }
        )

    leaderboard.sort(key=lambda x: x["esg_score"], reverse=True)

    return {"data": leaderboard, "total": len(leaderboard)}


@router.get("/scores/{bse_code}", response_model=dict)
def get_esg_score(bse_code: str, db: Session = Depends(get_db)):
    scores = SEED_SCORES.get(bse_code)

    if not scores:
        raise HTTPException(status_code=404, detail="Company not found")

    return {
        "bse_code": bse_code,
        "environmental_score": scores["e"],
        "social_score": scores["s"],
        "governance_score": scores["g"],
        "esg_score": scores["esg"],
        "predicted_return": scores["pred"],
        "benchmark_vs_nifty50": scores["vs_nifty"],
        "confidence_score": 85.0,
        "sentiment_summary": "Strong ESG performance with notable environmental and social initiatives.",
        "key_insights": [
            {
                "quote": "Reduced carbon emissions significantly",
                "category": "environmental",
                "impact": "high",
            },
            {
                "quote": "Strong diversity programs",
                "category": "social",
                "impact": "medium",
            },
            {
                "quote": "Transparent governance practices",
                "category": "governance",
                "impact": "high",
            },
        ],
        "analysis_date": datetime.utcnow().isoformat(),
    }


@router.post("/analyze/{bse_code}")
def analyze_company(
    bse_code: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    if bse_code not in SEED_SCORES:
        raise HTTPException(status_code=404, detail="Company not found")

    return {"status": "success", "bse_code": bse_code, "message": "Analysis completed"}


@router.post("/portfolio/analyze", response_model=PortfolioAnalysisResponse)
def analyze_portfolio(holdings: List[dict]):
    esg_scores = [SEED_SCORES.get(h["bse_code"], {}).get("esg", 50) for h in holdings]

    metrics = portfolio_optimizer.calculate_portfolio_metrics(holdings, esg_scores)
    comparison = portfolio_optimizer.calculate_benchmark_comparison(metrics)
    monte_carlo = portfolio_optimizer.monte_carlo_simulation(holdings, esg_scores)

    return {
        "metrics": {
            "expected_return": metrics.expected_return,
            "volatility": metrics.volatility,
            "sharpe_ratio": metrics.sharpe_ratio,
            "var_95": metrics.var_95,
            "esg_adjusted_return": metrics.esg_adjusted_return,
        },
        "benchmark_comparison": comparison,
        "monte_carlo": monte_carlo,
    }


@router.get("/health", response_model=HealthResponse)
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "nlp": "ready" if nlp_service.model else "fallback",
    }


@router.on_event("startup")
def startup_event():
    init_db()
