import numpy as np
from typing import Dict, Optional, List
from dataclasses import dataclass
import json
from datetime import datetime


@dataclass
class PortfolioMetrics:
    expected_return: float
    volatility: float
    sharpe_ratio: float
    var_95: float
    esg_adjusted_return: float


class PortfolioOptimizer:
    def __init__(self, risk_free_rate: float = 0.05):
        self.risk_free_rate = risk_free_rate

    def calculate_portfolio_metrics(
        self, holdings: List[Dict], esg_scores: List[float]
    ) -> PortfolioMetrics:
        total_value = sum(h["shares"] * h["avg_cost"] for h in holdings)
        weights = np.array(
            [h["shares"] * h["avg_cost"] / total_value for h in holdings]
        )

        # Simulate returns (μ=12%, σ=15%)
        portfolio_return = 0.12
        portfolio_volatility = 0.15

        # Sharpe Ratio
        sharpe_ratio = (
            (portfolio_return - self.risk_free_rate) / portfolio_volatility
            if portfolio_volatility > 0
            else 0
        )

        # VaR 95%
        var_95 = -1.65 * portfolio_volatility

        # ESG-Adjusted Return
        avg_esg = np.mean(esg_scores)
        if avg_esg >= 80:
            esg_premium = 0.05
        elif avg_esg >= 70:
            esg_premium = 0.035
        elif avg_esg >= 60:
            esg_premium = 0.02
        else:
            esg_premium = 0.0

        esg_adjusted_return = portfolio_return + esg_premium

        return PortfolioMetrics(
            expected_return=round(portfolio_return * 100, 2),
            volatility=round(portfolio_volatility * 100, 2),
            sharpe_ratio=round(sharpe_ratio, 3),
            var_95=round(var_95 * 100, 2),
            esg_adjusted_return=round(esg_adjusted_return * 100, 2),
        )

    def monte_carlo_simulation(
        self,
        holdings: List[Dict],
        esg_scores: List[float],
        n_simulations: int = 1000,
        trading_days: int = 252,
    ) -> Dict:
        total_value = sum(h["shares"] * h["avg_cost"] for h in holdings)

        # Simulated daily returns
        daily_mu = 0.12 / 252
        daily_sigma = 0.15 / np.sqrt(252)

        simulations = []
        for _ in range(n_simulations):
            daily_returns = np.random.normal(daily_mu, daily_sigma, trading_days)
            cumulative_returns = np.cumprod(1 + daily_returns) - 1
            simulations.append(cumulative_returns)

        simulations = np.array(simulations)

        avg_esg = np.mean(esg_scores)
        esg_bonus = 0.02 if avg_esg >= 70 else 0.0

        annual_returns = simulations[:, -1] * 100

        percentiles = np.percentile(simulations, [5, 50, 95], axis=0)
        median_simulation = percentiles[1].tolist()

        return {
            "mean_return": round(np.mean(annual_returns), 2),
            "std_dev": round(np.std(annual_returns), 2),
            "min_return": round(np.min(annual_returns), 2),
            "max_return": round(np.max(annual_returns), 2),
            "percentile_5": round(np.percentile(annual_returns, 5), 2),
            "percentile_95": round(np.percentile(annual_returns, 95), 2),
            "prob_positive": round(np.mean(annual_returns > 0) * 100, 2),
            "esg_bonus_applied": round(esg_bonus * 100, 2),
            "simulation_data": [round(v * 100, 4) for v in median_simulation],
        }

    def calculate_benchmark_comparison(
        self, portfolio_metrics: PortfolioMetrics, benchmark_return: float = 11.0
    ) -> Dict:
        excess_return = portfolio_metrics.expected_return - benchmark_return
        alpha = portfolio_metrics.esg_adjusted_return - benchmark_return

        return {
            "benchmark_return": benchmark_return,
            "portfolio_return": portfolio_metrics.expected_return,
            "excess_return": round(excess_return, 2),
            "alpha": round(alpha, 2),
            "outperformance": excess_return > 0,
        }


class MLScoringService:
    def __init__(self):
        self.model_path = "models/esg_predictor.pkl"
        self.model = None

    def predict_return(self, esg_data: Dict, company_info: Dict) -> Dict:
        esg_score = esg_data.get("esg_score", 50)
        sector = company_info.get("sector", "Consumer")

        base_return = 8.0

        if esg_score >= 80:
            esg_premium = 5.0
        elif esg_score >= 70:
            esg_premium = 3.5
        elif esg_score >= 60:
            esg_premium = 2.0
        elif esg_score >= 50:
            esg_premium = 0.5
        else:
            esg_premium = -1.0

        sector_multipliers = {
            "Technology": 1.2,
            "Finance": 0.9,
            "Energy": 0.85,
            "Renewable Energy": 1.3,
            "Healthcare": 1.1,
            "Consumer": 1.0,
            "Manufacturing": 0.95,
        }

        sector_multiplier = sector_multipliers.get(sector, 1.0)
        predicted_return = base_return + esg_premium * sector_multiplier
        predicted_return += np.random.normal(0, 1.5)

        benchmark_return = 11.0
        benchmark_vs_nifty50 = predicted_return - benchmark_return
        confidence = min(70 + (esg_score - 50) * 0.5, 95)

        return {
            "predicted_return": round(predicted_return, 2),
            "benchmark_vs_nifty50": round(benchmark_vs_nifty50, 2),
            "confidence_score": round(confidence, 2),
            "model_used": "Heuristic",
        }


ml_service = MLScoringService()
portfolio_optimizer = PortfolioOptimizer()
