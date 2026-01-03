import google.generativeai as genai
from typing import Dict, List, Optional
from pydantic import BaseModel
from app.config import settings
import json
import os


class ESGAnalysisResult(BaseModel):
    environmental_score: float
    social_score: float
    governance_score: float
    esg_score: float
    key_insights: List[Dict]
    sentiment_summary: str


class GeminiNLPService:
    def __init__(self):
        api_key = settings.GEMINI_API_KEY
        if api_key and api_key != "your-gemini-api-key":
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-pro")
        else:
            self.model = None

    async def analyze_text(self, text: str, company_name: str) -> ESGAnalysisResult:
        if not self.model:
            return self._rule_based_analysis(text)

        prompt = f"""
        Analyze the following ESG (Environmental, Social, Governance) information for {company_name}.
        
        TEXT CONTENT:
        {text[:10000]}
        
        Provide a JSON response with:
        - environmental_score (0-100): Based on carbon, energy, waste, water initiatives
        - social_score (0-100): Based on employee welfare, diversity, community
        - governance_score (0-100): Based on board, transparency, ethics
        - esg_score (0-100): Weighted average
        - key_insights: List of specific initiatives
        - sentiment_summary: Overall ESG assessment
        
        Return ONLY valid JSON:
        {{
            "environmental_score": 75,
            "social_score": 80,
            "governance_score": 85,
            "esg_score": 80,
            "key_insights": [
                {{"quote": "Reduced carbon emissions by 25%", "category": "environmental", "impact": "high"}}
            ],
            "sentiment_summary": "Strong ESG performance with notable environmental initiatives"
        }}
        """

        try:
            response = await self.model.generate_content_async(prompt)
            return self._parse_response(response.text)
        except Exception as e:
            print(f"Gemini API error: {e}")
            return self._rule_based_analysis(text)

    def _parse_response(self, response: str) -> ESGAnalysisResult:
        try:
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:-3]
            elif response.startswith("```"):
                response = response[3:-3]

            data = json.loads(response)

            return ESGAnalysisResult(
                environmental_score=data.get("environmental_score", 50),
                social_score=data.get("social_score", 50),
                governance_score=data.get("governance_score", 50),
                esg_score=data.get("esg_score", 50),
                key_insights=data.get("key_insights", []),
                sentiment_summary=data.get("sentiment_summary", ""),
            )
        except json.JSONDecodeError:
            return self._rule_based_analysis(response)

    def _rule_based_analysis(self, text: str) -> ESGAnalysisResult:
        text_lower = text.lower()

        env_keywords = {
            "carbon": 2,
            "emissions": 2,
            "renewable": 3,
            "solar": 2.5,
            "wind": 2.5,
            "green": 2,
            "sustainability": 2.5,
            "waste": 1.5,
            "recycling": 2,
            "water": 1.5,
            "energy": 1.5,
            "efficiency": 2,
            "net zero": 4,
            "carbon neutral": 4,
        }

        social_keywords = {
            "employee": 1.5,
            "diversity": 2.5,
            "inclusion": 2.5,
            "community": 2,
            "welfare": 2,
            "safety": 2,
            "health": 1.5,
            "training": 1.5,
            "development": 1.5,
            "labor": 2,
            "human rights": 3,
            "fair wage": 2,
            "gender": 2,
        }

        gov_keywords = {
            "board": 2,
            "independent": 2.5,
            "transparency": 2.5,
            "audit": 2,
            "compliance": 2,
            "ethics": 2.5,
            "corruption": -3,
            "shareholder": 2,
            "compensation": 1.5,
            "governance": 2.5,
            "risk": 1.5,
            "oversight": 2,
        }

        env_score = self._calculate_score(text_lower, env_keywords)
        social_score = self._calculate_score(text_lower, social_keywords)
        gov_score = self._calculate_score(text_lower, gov_keywords)

        esg_score = env_score * 0.35 + social_score * 0.30 + gov_score * 0.35

        return ESGAnalysisResult(
            environmental_score=round(env_score, 1),
            social_score=round(social_score, 1),
            governance_score=round(gov_score, 1),
            esg_score=round(esg_score, 1),
            key_insights=[],
            sentiment_summary="Analysis based on keyword extraction from available text.",
        )

    def _calculate_score(self, text: str, keywords: Dict[str, float]) -> float:
        score = 0
        max_possible = sum(keywords.values()) * 3

        for keyword, weight in keywords.items():
            count = text.count(keyword)
            score += min(count * weight, weight * 3)

        normalized_score = (
            min((score / max_possible) * 100, 100) if max_possible > 0 else 50
        )
        return round(normalized_score + 20, 1)

    async def batch_analyze(
        self, texts: List[Dict[str, str]]
    ) -> List[ESGAnalysisResult]:
        results = []
        for item in texts:
            result = await self.analyze_text(item["text"], item["company"])
            results.append(result)
        return results


nlp_service = GeminiNLPService()
