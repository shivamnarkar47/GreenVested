from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
    Boolean,
    Date,
    JSON,
)
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import uuid

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    portfolios = relationship("Portfolio", back_populates="owner")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    bse_code = Column(String(20), unique=True, index=True, nullable=False)
    nse_code = Column(String(20), index=True)
    company_name = Column(String(500), nullable=False)
    sector = Column(String(100), index=True)
    industry = Column(String(100))
    market_cap = Column(Float)
    headquarters = Column(String(200))
    website = Column(String(500))
    description = Column(Text)
    state = Column(String(100), index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    scores = relationship("ESGScore", back_populates="company")
    portfolio_items = relationship("PortfolioItem", back_populates="company")


class ESGScore(Base):
    __tablename__ = "esg_scores"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)

    environmental_score = Column(Float)
    social_score = Column(Float)
    governance_score = Column(Float)
    esg_score = Column(Float, index=True)

    predicted_return = Column(Float)
    benchmark_vs_nifty50 = Column(Float)
    confidence_score = Column(Float)

    sentiment_summary = Column(Text)
    key_insights = Column(JSON)

    analysis_date = Column(DateTime, default=datetime.utcnow)
    source = Column(String(100))

    company = relationship("Company", back_populates="scores")


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    total_value = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="portfolios")
    items = relationship(
        "PortfolioItem", back_populates="portfolio", cascade="all, delete-orphan"
    )


class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    shares = Column(Float, nullable=False)
    avg_cost = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    portfolio = relationship("Portfolio", back_populates="items")
    company = relationship("Company", back_populates="portfolio_items")


class EnvironmentalData(Base):
    __tablename__ = "environmental_data"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String(100), index=True, nullable=False)
    aqi = Column(Integer)
    pm25 = Column(Float)
    pm10 = Column(Float)
    temperature = Column(Float)
    humidity = Column(Float)
    rainfall = Column(Float)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class ClimateRiskZone(Base):
    __tablename__ = "climate_risk_zones"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String(100), index=True, nullable=False)
    risk_type = Column(String(50), index=True)
    risk_level = Column(String(20), index=True)
    description = Column(Text)
    affected_districts = Column(JSON)
    mitigation_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
