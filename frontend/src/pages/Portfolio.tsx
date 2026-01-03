import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MonteCarloChart } from '@/components/Charts'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Plus, Trash2, TrendingUp, RefreshCw, AlertCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']

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

function StatBox({ label, value, color = 'text-foreground' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-muted/40 rounded-lg p-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
    </div>
  )
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
    name: h.company_name.substring(0, 10),
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Simulator</h1>
          <p className="text-muted-foreground">Build and analyze ESG-optimized portfolios</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Holdings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {holdings.map((holding, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                      (holding.esg_score || 0) >= 80 ? 'bg-emerald-500' : 
                      (holding.esg_score || 0) >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}>
                      {holding.esg_score}
                    </div>
                    <div>
                      <p className="font-medium">{holding.company_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {holding.bse_code} • {holding.shares} shares @ ₹{holding.avg_cost.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">₹{(holding.shares * holding.avg_cost).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {(holding.shares * holding.avg_cost / totalValue * 100).toFixed(1)}%
                      </p>
                    </div>
                    <button 
                      onClick={() => handleRemoveStock(index)}
                      className="text-muted-foreground hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-4 gap-3 pt-3 border-t">
                <input
                  placeholder="BSE Code"
                  value={newStock.bse_code}
                  onChange={(e) => setNewStock({ ...newStock, bse_code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                />
                <input
                  type="number"
                  placeholder="Shares"
                  value={newStock.shares}
                  onChange={(e) => setNewStock({ ...newStock, shares: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                />
                <input
                  type="number"
                  placeholder="Cost"
                  value={newStock.avg_cost}
                  onChange={(e) => setNewStock({ ...newStock, avg_cost: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                />
                <Button onClick={handleAddStock} className="gap-2">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {analysis && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Monte Carlo Simulation</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] mb-4">
                  <MonteCarloChart data={monteCarloData.slice(0, 200)} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatBox label="Mean Return" value={`${analysis.monte_carlo.mean_return}%`} color="text-emerald-600" />
                  <StatBox label="Std Dev" value={`${analysis.monte_carlo.std_dev}%`} />
                  <StatBox label="VaR 95%" value={`${analysis.metrics.var_95}%`} color="text-red-500" />
                  <StatBox label="Prob. Positive" value={`${analysis.monte_carlo.prob_positive}%`} color="text-emerald-600" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
            <CardHeader className="pb-2">
              <Button
                variant="ghost"
                className="w-full justify-between hover:bg-emerald-500/10"
                onClick={() => setShowEducation(!showEducation)}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-base">What is Monte Carlo Simulation?</CardTitle>
                </div>
                {showEducation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </CardHeader>
            {showEducation && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  Monte Carlo Simulation runs thousands of possible scenarios for your portfolio
                  to help you understand the range of potential outcomes over time.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-background/50 rounded-lg">
                    <p className="font-medium text-sm mb-1">Mean Return</p>
                    <p className="text-xs text-muted-foreground">The average outcome across all simulations</p>
                  </div>
                  <div className="p-3 bg-background/50 rounded-lg">
                    <p className="font-medium text-sm mb-1">VaR 95%</p>
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
              <ResponsiveContainer width="100%" height={180}>
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
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-muted-foreground">
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
                <span className="opacity-80">Expected Return</span>
                <span className="font-bold text-lg">{analysis?.metrics?.expected_return || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-80">ESG-Adjusted Return</span>
                <span className="font-bold text-lg">{analysis?.metrics?.esg_adjusted_return || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-80">Sharpe Ratio</span>
                <span className="font-bold">{analysis?.metrics?.sharpe_ratio || 0}</span>
              </div>
              <div className="pt-3 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">+{analysis?.benchmark_comparison?.excess_return || 0}%</span>
                  <span className="opacity-80">vs Nifty50</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {avgESG >= 70 && (
            <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">ESG Impact Bonus</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
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
                <Badge className="text-lg px-3 py-1 bg-emerald-100 text-emerald-700 border-emerald-200">
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
