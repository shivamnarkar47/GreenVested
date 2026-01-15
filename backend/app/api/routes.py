from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, desc
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.database import get_db, init_db, sync_engine
from app.models import (
    Company,
    ESGScore,
    User,
    Portfolio,
    PortfolioItem,
    EnvironmentalData,
    ClimateRiskZone,
)
from app.schemas import (
    CompanyCreate,
    CompanyResponse,
    ESGScoreResponse,
    PortfolioCreate,
    PortfolioResponse,
    PortfolioItemCreate,
    PortfolioItemResponse,
    UserCreate,
    UserResponse,
    TokenResponse,
    LeaderboardResponse,
    PortfolioAnalysisResponse,
    AnalysisResponse,
    HealthResponse,
    LoginRequest,
    StateESGAggregate,
    HeatmapDataPoint,
    CompanyLocation,
    RegionalComparison,
    EnvironmentalDataResponse,
    ClimateRiskZoneResponse,
)
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.services.nlp import nlp_service
from app.services.ml_scoring import ml_service, portfolio_optimizer
from app.services.gis import gis_service

router = APIRouter()


# Seed data for 8 companies with geographic data
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
        "latitude": 19.0760,
        "longitude": 72.8777,
        "state": "Maharashtra",
        "facilities": [
            {"name": "Refinery", "lat": 19.0760, "lng": 72.8777, "type": "refinery"},
            {
                "name": "Data Center",
                "lat": 18.5204,
                "lng": 73.8567,
                "type": "data_center",
            },
        ],
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
        "latitude": 19.0760,
        "longitude": 72.8777,
        "state": "Maharashtra",
        "facilities": [
            {
                "name": "TCS House",
                "lat": 19.0760,
                "lng": 72.8777,
                "type": "headquarters",
            },
            {
                "name": "Development Center",
                "lat": 12.9716,
                "lng": 77.5946,
                "type": "office",
            },
        ],
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
        "latitude": 19.0760,
        "longitude": 72.8777,
        "state": "Maharashtra",
        "facilities": [
            {
                "name": "Head Office",
                "lat": 19.0760,
                "lng": 72.8777,
                "type": "headquarters",
            },
            {"name": "Regional Hub", "lat": 13.0827, "lng": 80.2707, "type": "office"},
        ],
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
        "latitude": 19.0760,
        "longitude": 72.8777,
        "state": "Maharashtra",
        "facilities": [
            {
                "name": "ICICI Towers",
                "lat": 19.0760,
                "lng": 72.8777,
                "type": "headquarters",
            },
            {
                "name": "Processing Center",
                "lat": 28.7041,
                "lng": 77.1025,
                "type": "data_center",
            },
        ],
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
        "latitude": 19.0760,
        "longitude": 72.8777,
        "state": "Maharashtra",
        "facilities": [
            {
                "name": "L&T House",
                "lat": 19.0760,
                "lng": 72.8777,
                "type": "headquarters",
            },
            {
                "name": "Manufacturing Plant",
                "lat": 23.0225,
                "lng": 72.5714,
                "type": "factory",
            },
        ],
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
        "latitude": 12.9716,
        "longitude": 77.5946,
        "state": "Karnataka",
        "facilities": [
            {
                "name": "Infosys Campus",
                "lat": 12.9716,
                "lng": 77.5946,
                "type": "headquarters",
            },
            {
                "name": "Development Center",
                "lat": 13.0827,
                "lng": 80.2707,
                "type": "office",
            },
        ],
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
        "latitude": 19.0760,
        "longitude": 72.8777,
        "state": "Maharashtra",
        "facilities": [
            {
                "name": "Head Office",
                "lat": 19.0760,
                "lng": 72.8777,
                "type": "headquarters",
            },
            {
                "name": "Manufacturing Plant",
                "lat": 18.5204,
                "lng": 73.8567,
                "type": "factory",
            },
        ],
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
        "latitude": 19.0760,
        "longitude": 72.8777,
        "state": "Maharashtra",
        "facilities": [
            {
                "name": "Corporate Centre",
                "lat": 19.0760,
                "lng": 72.8777,
                "type": "headquarters",
            },
            {
                "name": "Regional Office",
                "lat": 22.5726,
                "lng": 88.3639,
                "type": "office",
            },
        ],
    },
    # Tamil Nadu - Chennai
    {
        "bse_code": "500114",
        "nse_code": "DRREDDY",
        "company_name": "Dr. Reddy's Laboratories Ltd",
        "sector": "Healthcare",
        "industry": "Pharmaceuticals",
        "market_cap": 950000,
        "headquarters": "Hyderabad",
        "website": "https://www.drreddys.com",
        "description": "Dr. Reddy's is an Indian multinational pharmaceutical company.",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "state": "Telangana",
        "facilities": [
            {
                "name": "Corporate Office",
                "lat": 17.3850,
                "lng": 78.4867,
                "type": "headquarters",
            },
            {
                "name": "Manufacturing Plant",
                "lat": 13.0827,
                "lng": 80.2707,
                "type": "factory",
            },
        ],
    },
    {
        "bse_code": "532488",
        "nse_code": "DIVISLAB",
        "company_name": "Divi's Laboratories Ltd",
        "sector": "Healthcare",
        "industry": "Pharmaceuticals",
        "market_cap": 1200000,
        "headquarters": "Hyderabad",
        "website": "https://www.divislabs.com",
        "description": "Divi's Laboratories is a pharmaceutical company specializing in APIs.",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "state": "Telangana",
        "facilities": [
            {
                "name": "Head Office",
                "lat": 17.3850,
                "lng": 78.4867,
                "type": "headquarters",
            },
            {
                "name": "API Plant",
                "lat": 16.5062,
                "lng": 80.6480,
                "type": "factory",
            },
        ],
    },
    # West Bengal - Kolkata
    {
        "bse_code": "500103",
        "nse_code": "BAJAJ-AUTO",
        "company_name": "Bajaj Auto Ltd",
        "sector": "Automotive",
        "industry": "Two & Three Wheelers",
        "market_cap": 2800000,
        "headquarters": "Pune",
        "website": "https://www.bajajauto.com",
        "description": "Bajaj Auto is a leading manufacturer of motorcycles and three-wheelers.",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "state": "Maharashtra",
        "facilities": [
            {
                "name": "Manufacturing Plant",
                "lat": 22.5726,
                "lng": 88.3639,
                "type": "factory",
            },
        ],
    },
    {
        "bse_code": "500490",
        "nse_code": "BAJFINANCE",
        "company_name": "Bajaj Finance Ltd",
        "sector": "Finance",
        "industry": "NBFC",
        "market_cap": 4500000,
        "headquarters": "Pune",
        "website": "https://www.bajajfinserv.in",
        "description": "Bajaj Finance is a non-banking financial company offering financial services.",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "state": "Maharashtra",
        "facilities": [
            {
                "name": "Head Office",
                "lat": 18.5204,
                "lng": 73.8567,
                "type": "headquarters",
            },
        ],
    },
    # Rajasthan - Jaipur
    {
        "bse_code": "532454",
        "nse_code": "BHARTIARTL",
        "company_name": "Bharti Airtel Ltd",
        "sector": "Telecommunication",
        "industry": "Telecom Services",
        "market_cap": 4200000,
        "headquarters": "New Delhi",
        "website": "https://www.airtel.in",
        "description": "Bharti Airtel is India's largest telecommunications company.",
        "latitude": 28.7041,
        "longitude": 77.1025,
        "state": "Delhi",
        "facilities": [
            {
                "name": "Corporate Office",
                "lat": 28.7041,
                "lng": 77.1025,
                "type": "headquarters",
            },
            {
                "name": "Network Hub",
                "lat": 26.9124,
                "lng": 75.7873,
                "type": "data_center",
            },
        ],
    },
    # Uttar Pradesh - Noida
    {
        "bse_code": "532281",
        "nse_code": "HCLTECH",
        "company_name": "HCL Technologies Ltd",
        "sector": "Technology",
        "industry": "IT Services",
        "market_cap": 3200000,
        "headquarters": "Noida",
        "website": "https://www.hcltech.com",
        "description": "HCL Technologies is a global IT services company.",
        "latitude": 28.5355,
        "longitude": 77.3910,
        "state": "Uttar Pradesh",
        "facilities": [
            {
                "name": "HCL Campus",
                "lat": 28.5355,
                "lng": 77.3910,
                "type": "headquarters",
            },
            {
                "name": "Development Center",
                "lat": 26.8467,
                "lng": 80.9462,
                "type": "office",
            },
        ],
    },
    # Madhya Pradesh - Indore
    {
        "bse_code": "500696",
        "nse_code": "HINDUNILVR",
        "company_name": "Hindustan Unilever Ltd",
        "sector": "Consumer",
        "industry": "FMCG",
        "market_cap": 5800000,
        "headquarters": "Mumbai",
        "website": "https://www.hul.co.in",
        "description": "Hindustan Unilever is a consumer goods company.",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "state": "Maharashtra",
        "facilities": [
            {
                "name": "Manufacturing Plant",
                "lat": 22.7196,
                "lng": 75.8577,
                "type": "factory",
            },
        ],
    },
    # Haryana - Gurugram
    {
        "bse_code": "500124",
        "nse_code": "DRREDDY",
        "company_name": "Hero MotoCorp Ltd",
        "sector": "Automotive",
        "industry": "Two Wheelers",
        "market_cap": 850000,
        "headquarters": "New Delhi",
        "website": "https://www.heromotocorp.com",
        "description": "Hero MotoCorp is the world's largest manufacturer of motorcycles.",
        "latitude": 28.7041,
        "longitude": 77.1025,
        "state": "Delhi",
        "facilities": [
            {
                "name": "Manufacturing Plant",
                "lat": 29.0588,
                "lng": 76.0856,
                "type": "factory",
            },
        ],
    },
    # Punjab - Chandigarh
    {
        "bse_code": "500830",
        "nse_code": "GODREJCP",
        "company_name": "Godrej Consumer Products Ltd",
        "sector": "Consumer",
        "industry": "FMCG",
        "market_cap": 1200000,
        "headquarters": "Mumbai",
        "website": "https://www.godrejcp.com",
        "description": "Godrej Consumer Products manufactures household and personal care products.",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "state": "Maharashtra",
        "facilities": [
            {
                "name": "Manufacturing Plant",
                "lat": 30.7333,
                "lng": 76.7794,
                "type": "factory",
            },
        ],
    },
    # Kerala - Kochi
    {
        "bse_code": "500530",
        "nse_code": "BOSCHLTD",
        "company_name": "Bosch Ltd",
        "sector": "Automotive",
        "industry": "Auto Components",
        "market_cap": 850000,
        "headquarters": "Bangalore",
        "website": "https://www.boschindia.com",
        "description": "Bosch Ltd is the Indian subsidiary of Robert Bosch GmbH.",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "state": "Karnataka",
        "facilities": [
            {
                "name": "Manufacturing Plant",
                "lat": 10.0889,
                "lng": 76.3456,
                "type": "factory",
            },
        ],
    },
    # Gujarat - Ahmedabad
    {
        "bse_code": "500257",
        "nse_code": "LUPIN",
        "company_name": "Lupin Ltd",
        "sector": "Healthcare",
        "industry": "Pharmaceuticals",
        "market_cap": 650000,
        "headquarters": "Mumbai",
        "website": "https://www.lupin.com",
        "description": "Lupin is a transnational pharmaceutical company.",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "state": "Maharashtra",
        "facilities": [
            {
                "name": "Manufacturing Plant",
                "lat": 23.0225,
                "lng": 72.5714,
                "type": "factory",
            },
        ],
    },
    {
        "bse_code": "500027",
        "nse_code": "ATUL",
        "company_name": "Atul Ltd",
        "sector": "Chemicals",
        "industry": "Specialty Chemicals",
        "market_cap": 250000,
        "headquarters": "Ahmedabad",
        "website": "https://www.atul.co.in",
        "description": "Atul Ltd is a manufacturer of chemicals and intermediates.",
        "latitude": 23.0225,
        "longitude": 72.5714,
        "state": "Gujarat",
        "facilities": [
            {
                "name": "Manufacturing Complex",
                "lat": 23.0225,
                "lng": 72.5714,
                "type": "factory",
            },
        ],
    },
    # Odisha - Bhubaneswar
    {
        "bse_code": "500770",
        "nse_code": "TATAMOTORS",
        "company_name": "Tata Motors Ltd",
        "sector": "Automotive",
        "industry": "Four Wheelers",
        "market_cap": 2200000,
        "headquarters": "Mumbai",
        "website": "https://www.tatamotors.com",
        "description": "Tata Motors is India's largest automobile company.",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "state": "Maharashtra",
        "facilities": [
            {
                "name": "Manufacturing Plant",
                "lat": 20.2961,
                "lng": 85.8245,
                "type": "factory",
            },
        ],
    },
    # Jharkhand - Ranchi
    {
        "bse_code": "500470",
        "nse_code": "TATASTEEL",
        "company_name": "Tata Steel Ltd",
        "sector": "Metals",
        "industry": "Steel",
        "market_cap": 1800000,
        "headquarters": "Mumbai",
        "website": "https://www.tatasteel.com",
        "description": "Tata Steel is one of the world's most geographically diversified steel producers.",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "state": "Maharashtra",
        "facilities": [
            {
                "name": "Steel Plant",
                "lat": 23.6102,
                "lng": 85.2799,
                "type": "factory",
            },
        ],
    },
    # Chhattisgarh - Raipur
    {
        "bse_code": "500295",
        "nse_code": "VEDL",
        "company_name": "Vedanta Ltd",
        "sector": "Metals",
        "industry": "Mining",
        "market_cap": 1400000,
        "headquarters": "Mumbai",
        "website": "https://www.vedantalimited.com",
        "description": "Vedanta Limited is a diversified natural resources company.",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "state": "Maharashtra",
        "facilities": [
            {
                "name": "Mining Operations",
                "lat": 21.2514,
                "lng": 81.6296,
                "type": "mine",
            },
        ],
    },
    # Uttarakhand - Dehradun
    {
        "bse_code": "500228",
        "nse_code": "MRF",
        "company_name": "MRF Ltd",
        "sector": "Automotive",
        "industry": "Tyres",
        "market_cap": 550000,
        "headquarters": "Chennai",
        "website": "https://www.mrftyres.com",
        "description": "MRF is India's largest tyre manufacturer.",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "state": "Tamil Nadu",
        "facilities": [
            {
                "name": "Manufacturing Plant",
                "lat": 30.0668,
                "lng": 79.0193,
                "type": "factory",
            },
        ],
    },
    # Himachal Pradesh - Shimla
    {
        "bse_code": "500085",
        "nse_code": "CHAMBAL",
        "company_name": "Chambal Fertilisers and Chemicals Ltd",
        "sector": "Chemicals",
        "industry": "Fertilisers",
        "market_cap": 180000,
        "headquarters": "New Delhi",
        "website": "https://www.chambalfertilisers.com",
        "description": "Chambal Fertilisers is a fertiliser company.",
        "latitude": 28.7041,
        "longitude": 77.1025,
        "state": "Delhi",
        "facilities": [
            {
                "name": "Fertiliser Plant",
                "lat": 31.1048,
                "lng": 77.1734,
                "type": "factory",
            },
        ],
    },
]

# Pre-computed ESG scores
SEED_SCORES = {
    # Maharashtra companies
    "500325": {"e": 68, "s": 75, "g": 73, "esg": 72, "pred": 14.5, "vs_nifty": 3.5},
    "532540": {"e": 82, "s": 88, "g": 85, "esg": 85, "pred": 16.2, "vs_nifty": 5.2},
    "500180": {"e": 75, "s": 80, "g": 79, "esg": 78, "pred": 15.8, "vs_nifty": 4.8},
    "532174": {"e": 73, "s": 78, "g": 77, "esg": 76, "pred": 15.2, "vs_nifty": 4.2},
    "500510": {"e": 65, "s": 72, "g": 73, "esg": 70, "pred": 13.5, "vs_nifty": 2.5},
    "500820": {"e": 70, "s": 76, "g": 76, "esg": 74, "pred": 14.2, "vs_nifty": 3.2},
    "500112": {"e": 68, "s": 73, "g": 72, "esg": 71, "pred": 13.8, "vs_nifty": 2.8},
    "500103": {"e": 69, "s": 74, "g": 71, "esg": 71, "pred": 13.9, "vs_nifty": 2.9},
    "500490": {"e": 74, "s": 79, "g": 76, "esg": 76, "pred": 15.1, "vs_nifty": 4.1},
    "500696": {"e": 78, "s": 82, "g": 80, "esg": 80, "pred": 15.9, "vs_nifty": 4.9},
    "500830": {"e": 72, "s": 77, "g": 74, "esg": 74, "pred": 14.3, "vs_nifty": 3.3},
    "500257": {"e": 71, "s": 76, "g": 73, "esg": 73, "pred": 14.0, "vs_nifty": 3.0},
    "500770": {"e": 67, "s": 71, "g": 69, "esg": 69, "pred": 13.2, "vs_nifty": 2.2},
    "500470": {"e": 64, "s": 68, "g": 66, "esg": 66, "pred": 12.8, "vs_nifty": 1.8},
    "500295": {"e": 58, "s": 62, "g": 60, "esg": 60, "pred": 11.5, "vs_nifty": 0.5},
    # Karnataka companies
    "500209": {"e": 80, "s": 85, "g": 84, "esg": 83, "pred": 16.8, "vs_nifty": 5.8},
    "500530": {"e": 76, "s": 81, "g": 79, "esg": 79, "pred": 15.6, "vs_nifty": 4.6},
    # Telangana companies
    "500114": {"e": 74, "s": 78, "g": 76, "esg": 76, "pred": 15.0, "vs_nifty": 4.0},
    "532488": {"e": 77, "s": 82, "g": 80, "esg": 80, "pred": 15.8, "vs_nifty": 4.8},
    # Delhi companies
    "532454": {"e": 69, "s": 73, "g": 71, "esg": 71, "pred": 13.7, "vs_nifty": 2.7},
    "500124": {"e": 70, "s": 74, "g": 72, "esg": 72, "pred": 13.9, "vs_nifty": 2.9},
    "500085": {"e": 68, "s": 72, "g": 70, "esg": 70, "pred": 13.4, "vs_nifty": 2.4},
    # Uttar Pradesh companies
    "532281": {"e": 75, "s": 80, "g": 78, "esg": 78, "pred": 15.5, "vs_nifty": 4.5},
    # Tamil Nadu companies
    "500228": {"e": 73, "s": 77, "g": 75, "esg": 75, "pred": 14.7, "vs_nifty": 3.7},
    # Gujarat companies
    "500027": {"e": 71, "s": 75, "g": 73, "esg": 73, "pred": 14.1, "vs_nifty": 3.1},
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
async def get_me(user: User = Depends(get_current_user)):
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
            # Remove facilities from seed data as it's not part of Company model
            company_data = {k: v for k, v in seed.items() if k != "facilities"}
            company = Company(**company_data)
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


# Portfolio CRUD Endpoints (Temporary: no auth for testing)
@router.get("/portfolios", response_model=List[PortfolioResponse])
async def get_user_portfolios(db: Session = Depends(get_db)):
    """Get all portfolios (temporary: no auth for testing)"""
    result = db.execute(
        select(Portfolio).options(
            selectinload(Portfolio.items).selectinload(PortfolioItem.company)
        )
    )
    return result.scalars().all()


@router.post("/portfolios", response_model=PortfolioResponse)
async def create_portfolio(portfolio: PortfolioCreate, db: Session = Depends(get_db)):
    """Create a new portfolio (temporary: no auth for testing)"""
    # Create the portfolio with a dummy user_id for testing
    db_portfolio = Portfolio(
        user_id=1,  # Dummy user ID for testing
        name=portfolio.name,
        description=portfolio.description,
    )
    db.add(db_portfolio)
    db.flush()  # Get the portfolio ID

    # Add portfolio items
    total_value = 0
    for item in portfolio.items:
        # Look up company by bse_code
        company_result = db.execute(
            select(Company).where(Company.bse_code == item.bse_code)
        )
        company = company_result.scalar_one_or_none()
        if not company:
            raise HTTPException(
                status_code=404,
                detail=f"Company with BSE code {item.bse_code} not found",
            )

        db_item = PortfolioItem(
            portfolio_id=db_portfolio.id,
            company_id=company.id,
            shares=item.shares,
            avg_cost=item.avg_cost,
        )
        db.add(db_item)
        total_value += item.shares * item.avg_cost

    # Update total value
    from sqlalchemy import update

    db.execute(
        update(Portfolio)
        .where(Portfolio.id == db_portfolio.id)
        .values(total_value=total_value)
    )
    db.commit()
    db.refresh(db_portfolio)

    return db_portfolio


@router.get("/portfolios/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(portfolio_id: int, db: Session = Depends(get_db)):
    """Get a specific portfolio by ID"""
    result = db.execute(
        select(Portfolio)
        .where(Portfolio.id == portfolio_id)
        .options(selectinload(Portfolio.items).selectinload(PortfolioItem.company))
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    return portfolio


@router.put("/portfolios/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(
    portfolio_id: int, portfolio_update: PortfolioCreate, db: Session = Depends(get_db)
):
    """Update a portfolio"""
    result = db.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Update basic info
    from sqlalchemy import update

    db.execute(
        update(Portfolio)
        .where(Portfolio.id == portfolio_id)
        .values(
            name=portfolio_update.name,
            description=portfolio_update.description,
            updated_at=datetime.utcnow(),
        )
    )

    # Remove existing items
    from sqlalchemy import delete

    db.execute(delete(PortfolioItem).where(PortfolioItem.portfolio_id == portfolio_id))

    # Add new items
    total_value = 0
    for item in portfolio_update.items:
        # Look up company by bse_code
        company_result = db.execute(
            select(Company).where(Company.bse_code == item.bse_code)
        )
        company = company_result.scalar_one_or_none()
        if not company:
            raise HTTPException(
                status_code=404,
                detail=f"Company with BSE code {item.bse_code} not found",
            )

        db_item = PortfolioItem(
            portfolio_id=portfolio.id,
            company_id=company.id,
            shares=item.shares,
            avg_cost=item.avg_cost,
        )
        db.add(db_item)
        total_value += item.shares * item.avg_cost

    # Update total value
    db.execute(
        update(Portfolio)
        .where(Portfolio.id == portfolio_id)
        .values(total_value=total_value)
    )

    db.commit()

    # Return updated portfolio
    result = db.execute(
        select(Portfolio)
        .where(Portfolio.id == portfolio_id)
        .options(selectinload(Portfolio.items).selectinload(PortfolioItem.company))
    )
    return result.scalar_one()


@router.delete("/portfolios/{portfolio_id}")
async def delete_portfolio(portfolio_id: int, db: Session = Depends(get_db)):
    """Delete a portfolio"""
    result = db.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    db.delete(portfolio)
    db.commit()

    return {"message": "Portfolio deleted successfully"}


@router.get("/health", response_model=HealthResponse)
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "nlp": "ready" if nlp_service.model else "fallback",
    }


# GIS Endpoints
@router.get("/gis/states", response_model=List[StateESGAggregate])
def get_statewise_esg_aggregates(db: Session = Depends(get_db)):
    return gis_service.get_statewise_esg_aggregates(db)


@router.get("/gis/heatmap", response_model=List[HeatmapDataPoint])
def get_heatmap_data(db: Session = Depends(get_db)):
    """Get ESG heatmap data for map visualization"""
    return gis_service.get_heatmap_data(db)


@router.get("/gis/companies/location", response_model=List[CompanyLocation])
def get_company_locations(db: Session = Depends(get_db)):
    """Get all companies with location data"""
    return gis_service.get_company_locations(db)


@router.get(
    "/gis/environmental/{state}", response_model=Optional[EnvironmentalDataResponse]
)
async def get_environmental_data_by_state(state: str, db: Session = Depends(get_db)):
    """Get environmental data for a specific state"""
    return await gis_service.get_environmental_data_by_state(state, db)


@router.get("/gis/climate-risk", response_model=List[ClimateRiskZoneResponse])
def get_climate_risk_zones(state: Optional[str] = None, db: Session = Depends(get_db)):
    """Get climate risk zones, optionally filtered by state"""
    return gis_service.get_climate_risk_zones(db, state)


@router.get("/gis/regional-comparison", response_model=List[RegionalComparison])
def get_regional_comparison(db: Session = Depends(get_db)):
    """Get regional ESG comparison with national averages"""
    return gis_service.get_regional_comparison(db)


# Seed data for climate risk zones and environmental data
CLIMATE_RISK_SEED = [
    {
        "state": "Maharashtra",
        "risk_type": "flood",
        "risk_level": "high",
        "description": "Coastal flooding risk, especially during monsoon season",
        "affected_districts": ["Mumbai", "Thane", "Raigad"],
        "mitigation_score": 7.5,
    },
    {
        "state": "Karnataka",
        "risk_type": "drought",
        "risk_level": "medium",
        "description": "Water scarcity in northern regions",
        "affected_districts": ["Bengaluru Rural", "Tumkur"],
        "mitigation_score": 6.8,
    },
    {
        "state": "Tamil Nadu",
        "risk_type": "heatwave",
        "risk_level": "high",
        "description": "Extreme heat events, particularly in central districts",
        "affected_districts": ["Chennai", "Coimbatore", "Madurai"],
        "mitigation_score": 8.2,
    },
    {
        "state": "Delhi",
        "risk_type": "air_quality",
        "risk_level": "critical",
        "description": "Severe air pollution from industrial and vehicular emissions",
        "affected_districts": ["Delhi", "Noida", "Gurgaon"],
        "mitigation_score": 4.5,
    },
]

ENVIRONMENTAL_DATA_SEED = [
    {
        "state": "Maharashtra",
        "aqi": 85,
        "pm25": 25.3,
        "pm10": 45.7,
        "temperature": 28.5,
        "humidity": 65.0,
        "rainfall": 0.0,
    },
    {
        "state": "Karnataka",
        "aqi": 45,
        "pm25": 12.5,
        "pm10": 28.3,
        "temperature": 26.8,
        "humidity": 70.0,
        "rainfall": 0.0,
    },
    {
        "state": "Tamil Nadu",
        "aqi": 65,
        "pm25": 18.7,
        "pm10": 35.2,
        "temperature": 30.2,
        "humidity": 60.0,
        "rainfall": 0.0,
    },
    {
        "state": "Delhi",
        "aqi": 145,
        "pm25": 85.3,
        "pm10": 120.5,
        "temperature": 32.1,
        "humidity": 45.0,
        "rainfall": 0.0,
    },
]


@router.on_event("startup")
def startup_event():
    init_db()

    # Seed climate risk zones and environmental data
    from sqlalchemy.orm import sessionmaker

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)
    db = SessionLocal()
    try:
        for risk_data in CLIMATE_RISK_SEED:
            existing = db.execute(
                select(ClimateRiskZone).where(
                    ClimateRiskZone.state == risk_data["state"],
                    ClimateRiskZone.risk_type == risk_data["risk_type"],
                )
            ).scalar_one_or_none()

            if not existing:
                risk_zone = ClimateRiskZone(**risk_data)
                db.add(risk_zone)

        # Seed environmental data
        for env_data in ENVIRONMENTAL_DATA_SEED:
            existing = db.execute(
                select(EnvironmentalData)
                .where(EnvironmentalData.state == env_data["state"])
                .order_by(EnvironmentalData.recorded_at.desc())
                .limit(1)
            ).scalar_one_or_none()

            if not existing or (datetime.utcnow() - existing.recorded_at).days > 1:
                environmental_data = EnvironmentalData(**env_data)
                db.add(environmental_data)

        db.commit()
        print("GIS seed data initialized successfully")
    except Exception as e:
        db.rollback()
        print(f"Error seeding GIS data: {e}")
    finally:
        db.close()
