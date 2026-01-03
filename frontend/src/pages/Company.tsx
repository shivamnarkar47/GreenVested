import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScoreBreakdown, ESGRadarChart } from '@/components/Charts'
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'

export default function Company() {
  const { bseCode } = useParams<{ bseCode: string }>()
  
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', bseCode],
    queryFn: () => api.getCompany(bseCode!),
    enabled: !!bseCode
  })

  const { data: score, isLoading: scoreLoading } = useQuery({
    queryKey: ['score', bseCode],
    queryFn: () => api.getScore(bseCode!),
    enabled: !!bseCode
  })

  if (companyLoading || scoreLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted w-48 rounded" />
        <div className="h-64 bg-muted rounded" />
        <div className="h-48 bg-muted rounded" />
      </div>
    )
  }

  if (!company || !score) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Company not found</p>
        <Link to="/dashboard">
          <Button className="mt-4">Back to Leaderboard</Button>
        </Link>
      </div>
    )
  }

  const eScore = score.environmental_score || 0
  const sScore = score.social_score || 0
  const gScore = score.governance_score || 0

  return (
    <div className="space-y-8">
      <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Leaderboard
      </Link>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-start gap-4">
            <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold text-white ${
              (score.esg_score || 0) >= 80 ? 'bg-emerald-500' : 
              (score.esg_score || 0) >= 70 ? 'bg-blue-500' : 
              (score.esg_score || 0) >= 60 ? 'bg-amber-500' : 'bg-red-500'
            }`}>
              {score.esg_score?.toFixed(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{company.company_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{company.bse_code}</Badge>
                <Badge>{company.sector}</Badge>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ExternalLink className="h-3 w-3" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {company.description && (
            <p className="mt-4 text-muted-foreground">{company.description}</p>
          )}
        </div>

        <Card className="w-full md:w-80">
          <CardHeader>
            <CardTitle className="text-lg">Predicted Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">1-Year Predicted Return</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span className="text-2xl font-bold text-emerald-600">
                  +{score.predicted_return?.toFixed(1)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">vs Nifty50 Benchmark</p>
              <div className="flex items-center gap-2">
                {(score.benchmark_vs_nifty50 || 0) >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
                <span className={`text-2xl font-bold ${
                  (score.benchmark_vs_nifty50 || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {(score.benchmark_vs_nifty50 || 0) >= 0 ? '+' : ''}{score.benchmark_vs_nifty50?.toFixed(1)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Model Confidence</p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${score.confidence_score || 0}%` }}
                />
              </div>
              <p className="text-sm text-right mt-1">{score.confidence_score?.toFixed(0)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ESG Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBreakdown eScore={eScore} sScore={sScore} gScore={gScore} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ESG Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ESGRadarChart 
              eScore={eScore} 
              sScore={sScore} 
              gScore={gScore}
              companyName={company.company_name}
            />
          </CardContent>
        </Card>
      </div>

      {score.key_insights && score.key_insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key ESG Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {score.key_insights.map((insight: any, index: number) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    insight.impact === 'high' ? 'bg-emerald-500' :
                    insight.impact === 'medium' ? 'bg-amber-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <p className="font-medium">"{insight.quote}"</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="capitalize">
                        {insight.category}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {insight.impact} impact
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {score.sentiment_summary && (
        <Card>
          <CardHeader>
            <CardTitle>ESG Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{score.sentiment_summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
