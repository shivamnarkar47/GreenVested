import asyncio
import httpx
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models import Company, EnvironmentalData, ClimateRiskZone
from app.schemas import (
    StateESGAggregate,
    HeatmapDataPoint,
    CompanyLocation,
    RegionalComparison,
    EnvironmentalDataResponse,
    ClimateRiskZoneResponse,
)

logger = logging.getLogger(__name__)


class GISService:
    def __init__(self):
        self.aqi_api_key = "your-aqi-api-key"  # Should come from config
        self.weather_api_key = "your-weather-api-key"  # Should come from config
        self.cache = {}
        self.cache_expiry = timedelta(hours=1)

    async def _get_cached_data(self, key: str):
        """Get cached data if not expired"""
        if key in self.cache:
            timestamp, data = self.cache[key]
            if datetime.now() - timestamp < self.cache_expiry:
                return data
        return None

    async def _set_cached_data(self, key: str, data: Any):
        """Cache data with timestamp"""
        self.cache[key] = (datetime.now(), data)

    def get_statewise_esg_aggregates(self, db: Session) -> List[StateESGAggregate]:
        """Get ESG aggregates by state"""
        # Get all companies with ESG scores
        companies = (
            db.execute(select(Company).where(Company.state.isnot(None))).scalars().all()
        )

        state_data = {}
        for company in companies:
            bse_code = company.bse_code
            scores = self._get_esg_scores(bse_code)

            if not scores or not company.state:
                continue

            state = company.state
            if state not in state_data:
                state_data[state] = {
                    "companies": [],
                    "esg_scores": [],
                    "e_scores": [],
                    "s_scores": [],
                    "g_scores": [],
                }

            state_data[state]["companies"].append(company.company_name)
            state_data[state]["esg_scores"].append(scores["esg"])
            state_data[state]["e_scores"].append(scores["e"])
            state_data[state]["s_scores"].append(scores["s"])
            state_data[state]["g_scores"].append(scores["g"])

        results = []
        for state, data in state_data.items():
            if data["esg_scores"]:
                avg_esg = sum(data["esg_scores"]) / len(data["esg_scores"])
                avg_e = sum(data["e_scores"]) / len(data["e_scores"])
                avg_s = sum(data["s_scores"]) / len(data["s_scores"])
                avg_g = sum(data["g_scores"]) / len(data["g_scores"])

                # Find top and lowest companies
                esg_with_names = list(zip(data["esg_scores"], data["companies"]))
                esg_with_names.sort(reverse=True)
                top_company = esg_with_names[0][1] if esg_with_names else None
                lowest_company = esg_with_names[-1][1] if esg_with_names else None

                results.append(
                    StateESGAggregate(
                        state=state,
                        company_count=len(data["companies"]),
                        avg_esg_score=round(avg_esg, 1),
                        avg_e_score=round(avg_e, 1),
                        avg_s_score=round(avg_s, 1),
                        avg_g_score=round(avg_g, 1),
                        top_company=top_company,
                        lowest_company=lowest_company,
                    )
                )

        return sorted(results, key=lambda x: x.avg_esg_score, reverse=True)

    def get_heatmap_data(self, db: Session) -> List[HeatmapDataPoint]:
        """Get data for ESG heatmap visualization"""
        states = self.get_statewise_esg_aggregates(db)

        heatmap_data = []
        for state_agg in states:
            # Get approximate coordinates for states (can be enhanced with proper geocoding)
            coords = self._get_state_coordinates(state_agg.state)

            heatmap_data.append(
                HeatmapDataPoint(
                    state=state_agg.state,
                    esg_score=state_agg.avg_esg_score,
                    e_score=state_agg.avg_e_score,
                    s_score=state_agg.avg_s_score,
                    g_score=state_agg.avg_g_score,
                    company_count=state_agg.company_count,
                    latitude=coords.get("lat"),
                    longitude=coords.get("lng"),
                )
            )

        return heatmap_data

    def get_company_locations(self, db: Session) -> List[CompanyLocation]:
        """Get all companies with location data"""
        companies = (
            db.execute(
                select(Company).where(
                    Company.latitude.isnot(None),
                    Company.longitude.isnot(None),
                    Company.state.isnot(None),
                )
            )
            .scalars()
            .all()
        )

        locations = []
        for company in companies:
            scores = self._get_esg_scores(company.bse_code)
            locations.append(
                CompanyLocation(
                    bse_code=company.bse_code,
                    company_name=company.company_name,
                    sector=company.sector,
                    esg_score=scores["esg"] if scores else None,
                    latitude=float(company.latitude) if company.latitude else 0.0,
                    longitude=float(company.longitude) if company.longitude else 0.0,
                    state=company.state,
                )
            )

        return locations

    async def get_environmental_data_by_state(
        self, state: str, db: Session
    ) -> Optional[EnvironmentalDataResponse]:
        """Get latest environmental data for a state"""
        cache_key = f"env_{state}"

        # Check cache first
        cached = await self._get_cached_data(cache_key)
        if cached:
            return EnvironmentalDataResponse(**cached)

        # Get from database
        result = db.execute(
            select(EnvironmentalData)
            .where(EnvironmentalData.state == state)
            .order_by(EnvironmentalData.recorded_at.desc())
            .limit(1)
        ).scalar_one_or_none()

        if result:
            data = EnvironmentalDataResponse.from_orm(result)
            await self._set_cached_data(cache_key, data.dict())
            return data

        # If no data, try to fetch fresh data
        fresh_data = await self._fetch_environmental_data(state)
        if fresh_data:
            # Store in database
            env_data = EnvironmentalData(
                state=state,
                aqi=fresh_data.get("aqi"),
                pm25=fresh_data.get("pm25"),
                pm10=fresh_data.get("pm10"),
                temperature=fresh_data.get("temperature"),
                humidity=fresh_data.get("humidity"),
                rainfall=fresh_data.get("rainfall"),
            )
            db.add(env_data)
            db.commit()
            db.refresh(env_data)

            data = EnvironmentalDataResponse.from_orm(env_data)
            await self._set_cached_data(cache_key, data.dict())
            return data

        return None

    def get_climate_risk_zones(
        self, db: Session, state: Optional[str] = None
    ) -> List[ClimateRiskZoneResponse]:
        """Get climate risk zones"""
        query = select(ClimateRiskZone)
        if state:
            query = query.where(ClimateRiskZone.state == state)

        results = db.execute(query).scalars().all()
        return [ClimateRiskZoneResponse.from_orm(risk_zone) for risk_zone in results]

    def get_regional_comparison(self, db: Session) -> List[RegionalComparison]:
        """Get regional ESG comparison with national averages"""
        states = self.get_statewise_esg_aggregates(db)

        if not states:
            return []

        # Calculate national average
        national_avg = sum(s.avg_esg_score for s in states) / len(states)

        comparisons = []
        for i, state_agg in enumerate(states, 1):
            comparisons.append(
                RegionalComparison(
                    state=state_agg.state,
                    esg_score=state_agg.avg_esg_score,
                    national_avg=round(national_avg, 1),
                    deviation=round(state_agg.avg_esg_score - national_avg, 1),
                    rank=i,
                    total_states=len(states),
                )
            )

        return comparisons

    async def _fetch_environmental_data(self, state: str) -> Optional[Dict[str, Any]]:
        """Fetch environmental data from external APIs"""
        try:
            # This would integrate with actual APIs like AQI India, OpenWeatherMap, etc.
            # For now, return mock data
            return {
                "aqi": 85,
                "pm25": 25.3,
                "pm10": 45.7,
                "temperature": 28.5,
                "humidity": 65.0,
                "rainfall": 0.0,
            }
        except Exception as e:
            logger.error(f"Error fetching environmental data for {state}: {e}")
            return None

    def _get_esg_scores(self, bse_code: str) -> Optional[Dict[str, float]]:
        """Get ESG scores for a company (from seed data for now)"""
        # This should come from ESGScore model in production
        scores: Dict[str, Dict[str, float]] = {
            "500325": {"e": 68.0, "s": 75.0, "g": 73.0, "esg": 72.0},
            "532540": {"e": 82.0, "s": 88.0, "g": 85.0, "esg": 85.0},
            "500180": {"e": 75.0, "s": 80.0, "g": 79.0, "esg": 78.0},
            "532174": {"e": 73.0, "s": 78.0, "g": 77.0, "esg": 76.0},
            "500510": {"e": 65.0, "s": 72.0, "g": 73.0, "esg": 70.0},
            "500209": {"e": 80.0, "s": 85.0, "g": 84.0, "esg": 83.0},
            "500820": {"e": 70.0, "s": 76.0, "g": 76.0, "esg": 74.0},
            "500112": {"e": 68.0, "s": 73.0, "g": 72.0, "esg": 71.0},
        }
        return scores.get(bse_code)

    def _get_state_coordinates(self, state: str) -> Dict[str, float]:
        """Get approximate coordinates for Indian states"""
        coordinates: Dict[str, Dict[str, float]] = {
            "Maharashtra": {"lat": 19.0760, "lng": 72.8777},
            "Karnataka": {"lat": 12.9716, "lng": 77.5946},
            "Tamil Nadu": {"lat": 13.0827, "lng": 80.2707},
            "Delhi": {"lat": 28.7041, "lng": 77.1025},
            "Gujarat": {"lat": 23.0225, "lng": 72.5714},
            "Telangana": {"lat": 17.3850, "lng": 78.4867},
            "West Bengal": {"lat": 22.5726, "lng": 88.3639},
            "Rajasthan": {"lat": 26.9124, "lng": 75.7873},
            "Uttar Pradesh": {"lat": 26.8467, "lng": 80.9462},
            "Madhya Pradesh": {"lat": 22.7196, "lng": 75.8577},
            "Haryana": {"lat": 29.0588, "lng": 76.0856},
            "Punjab": {"lat": 30.7333, "lng": 76.7794},
            "Bihar": {"lat": 25.0961, "lng": 85.3131},
            "Odisha": {"lat": 20.2961, "lng": 85.8245},
            "Jharkhand": {"lat": 23.6102, "lng": 85.2799},
            "Chhattisgarh": {"lat": 21.2514, "lng": 81.6296},
            "Uttarakhand": {"lat": 30.0668, "lng": 79.0193},
            "Himachal Pradesh": {"lat": 31.1048, "lng": 77.1734},
            "Jammu and Kashmir": {"lat": 34.0837, "lng": 74.7973},
            "Goa": {"lat": 15.2993, "lng": 74.1240},
            "Kerala": {"lat": 8.5241, "lng": 76.9366},
            "Puducherry": {"lat": 11.9416, "lng": 79.8083},
            "Chandigarh": {"lat": 30.7333, "lng": 76.7794},
            "Dadra and Nagar Haveli and Daman and Diu": {
                "lat": 20.3974,
                "lng": 72.8328,
            },
            "Ladakh": {"lat": 34.1526, "lng": 77.5771},
            "Lakshadweep": {"lat": 10.5667, "lng": 72.6417},
            "Andaman and Nicobar Islands": {"lat": 11.7401, "lng": 92.6586},
            "Sikkim": {"lat": 27.5330, "lng": 88.5122},
            "Arunachal Pradesh": {"lat": 27.1020, "lng": 93.6920},
            "Nagaland": {"lat": 25.6738, "lng": 94.1086},
            "Manipur": {"lat": 24.8170, "lng": 93.9368},
            "Mizoram": {"lat": 23.1645, "lng": 92.9376},
            "Tripura": {"lat": 23.9408, "lng": 91.9882},
            "Meghalaya": {"lat": 25.4670, "lng": 91.3662},
            "Assam": {"lat": 26.2006, "lng": 92.9376},
        }
        return coordinates.get(state, {"lat": 20.5937, "lng": 78.9629})


# Global service instance
gis_service = GISService()
