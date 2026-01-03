import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MonteCarloChart } from '@/components/Charts'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Plus, Trash2, TrendingUp, RefreshCw, AlertCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

const DEFAULT_HOLDINGS = [
  { bse_code: '532540', company_name: 'TCS', shares: 50, avg_cost: 3800, esg_score: 85 },
  { bse_code: '500209', company_name: 'Infosys', shares: 40, avg_cost: 1500, esg_score: 83 },
  { bse_code: '500180', company_name: 'HDFC Bank', shares: 75, avg_cost: 1600, esg_score: 78 },
]

const companyNames: Record<string, string> = {
  '500325': 'Reliance Industries',
  '532540': 'TCS',
  '500180': 'HDFC Bank',
  '532174': 'ICICI Bank',
  '500510': 'Larsen & Toubro',
  '500209': 'Infosys',
  '500820': 'Asian Paints',
  '500112': 'State Bank of India',
}

const esgScores: Record<string, number> = {
  '500325': 72, '532540': 85, '500180': 78, '532174': 76,
  '500510': 70, '500209': 83, '500820': 74, '500112': 71,
}

export default function Portfolio() {
  const [holdings, setHoldings] = useState(DEFAULT_HOLDINGS)
  const [newStock, setNewStock] = useState({ bse_code: '', shares: '', avg_cost: '' })
  const [showEducation, setShowEducation] = useState(false)

  const { data: analysis, refetch } = useQuery({
    queryKey: ['portfolio-analysis', holdings],
    queryFn: () => api.analyzePortfolio(holdings),
    enabled: holdings.length > 0
  })

  const pieData = holdings.map(h => ({
    name: h.company_name.substring(0, 12),
    value: Math.round(h.shares * h.avg_cost)
  }))

  const totalValue = holdings.reduce((acc, h) => acc + h.shares * h.avg_cost, 0)
  const avgESG = holdings.length > 0 
    ? Math.round(holdings.reduce((acc, h) => acc + (h.esg_score || 50), 0) / holdings.length)
    : 0

  const handleAddStock = () => {
    if (!newStock.bse_code || !newStock.shares || !newStock.avg_cost) return
    const code = newStock.bse_code.toUpperCase()
    setHoldings([...holdings, {
      bse_code: code,
      company_name: companyNames[code] || `Company ${code}`,
      shares: parseFloat(newStock.shares),
      avg_cost: parseFloat(newStock.avg_cost),
      esg_score: esgScores[code] || 65
    }])
    setNewStock({ bse_code: '', shares: '', avg_cost: '' })
  }

  const handleRemoveStock = (index: number) => {
    setHoldings(holdings.filter((_, i) => i !== index))
  }

  const monteCarloData = analysis?.monte_carlo?.simulation_data || []

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Portfolio Simulator</h1>
          <p className="text-sm md:text-base text-muted-foreground">Build and analyze ESG-optimized portfolios</p>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-lg md:text-xl">Holdings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {holdings.map((holding, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/50 rounded-lg gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-bold text-white text-sm md:text-base flex-shrink-0 ${
                      (holding.esg_score || 0) >= 80 ? 'bg-emerald-500' : 
                      (holding.esg_score || 0) >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}>
                      {holding.esg_score}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm md:text-base truncate">{holding.company_name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {holding.bse_code} - {holding.shares} shares @ ₹{holding.avg_cost.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                    <div className="text-right">
                      <p className="font-medium text-sm md:text-base">₹{(holding.shares * holding.avg_cost).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {(holding.shares * holding.avg_cost / totalValue * 100).toFixed(1)}%
                      </p>
                    </div>
                    <button 
                      onClick={() => handleRemoveStock(index)}
                      className="text-muted-foreground hover:text-red-500 flex-shrink-0 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-2">
                <div className="sm:col-span-1">
                  <Input
                    placeholder="BSE Code"
                    value={newStock.bse_code}
                    onChange={(e) => setNewStock({ ...newStock, bse_code: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Shares"
                  value={newStock.shares}
                  onChange={(e) => setNewStock({ ...newStock, shares: e.target.value })}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Cost"
                    value={newStock.avg_cost}
                    onChange={(e) => setNewStock({ ...newStock, avg_cost: e.target.value })}
                    className="text-sm flex-1"
                  />
                  <Button onClick={handleAddStock} size="sm" className="gap-1 px-3">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {analysis && (
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
                <CardTitle className="text-lg md:text-xl">Monte Carlo Simulation (1000 runs)</CardTitle>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 w-full sm:w-auto">
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full h-[250px] md:h-[300px]">
                  <MonteCarloChart data={monteCarloData.slice(0, 200)} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Mean Return</p>
                    <p className="text-lg font-bold text-emerald-600">{analysis.monte_carlo.mean_return}%</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Std Deviation</p>
                    <p className="text-lg font-bold">{analysis.monte_carlo.std_dev}%</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">VaR 95%</p>
                    <p className="text-lg font-bold text-red-500">{analysis.metrics.var_95}%</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Prob. Positive</p>
                    <p className="text-lg font-bold text-emerald-600">{analysis.monte_carlo.prob_positive}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="pb-3">
              <Button
                variant="ghost"
                className="w-full justify-between hover:bg-emerald-500/10 h-auto py-2"
                onClick={() => setShowEducation(!showEducation)}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-lg">What is Monte Carlo Simulation?</CardTitle>
                </div>
                {showEducation ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </CardHeader>
            {showEducation && (
              <CardContent className="pt-0 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Monte Carlo Simulation runs thousands of possible scenarios for your portfolio
                  to help you understand the range of potential outcomes over time.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-background/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Mean Return</p>
                    <p className="text-xs text-muted-foreground">The average outcome across all simulations</p>
                  </div>
                  <div className="p-3 bg-background/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">VaR 95%</p>
                    <p className="text-xs text-muted-foreground">95% of outcomes were better than this value</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180} className="sm:height-[200px]">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="text-muted-foreground flex-shrink-0 ml-2">
                      {(item.value / totalValue * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="opacity-80 text-sm">Expected Return</span>
                <span className="font-bold text-xl">{analysis?.metrics?.expected_return || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-80 text-sm">ESG-Adjusted Return</span>
                <span className="font-bold text-xl">{analysis?.metrics?.esg_adjusted_return || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-80 text-sm">Sharpe Ratio</span>
                <span className="font-bold">{analysis?.metrics?.sharpe_ratio || 0}</span>
              </div>
              <div className="pt-3 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-medium">+{analysis?.benchmark_comparison?.excess_return || 0}%</span>
                  <span className="opacity-80 text-sm">vs Nifty50</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {avgESG >= 70 && (
            <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">ESG Impact Bonus</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Your portfolio's average ESG score of {avgESG} qualifies for a +2% annual return boost.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                  <p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1 bg-emerald-50 border-emerald-200 text-emerald-700">
                  ESG: {avgESG}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
