import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Leaderboard from '@/components/Leaderboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, Leaf, Users, TrendingUp } from 'lucide-react'

export default function Dashboard() {

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.getLeaderboard(undefined, 50)
  })

  const stats = {
    companies: leaderboard?.total || 0,
    avgESG: leaderboard?.data 
      ? Math.round(leaderboard.data.reduce((acc: number, c: any) => acc + (c.esg_score || 0), 0) / leaderboard.data.length)
      : 0,
    highESG: leaderboard?.data 
      ? leaderboard.data.filter((c: any) => (c.esg_score || 0) >= 70).length 
      : 0,
    avgOutperformance: leaderboard?.data
      ? (leaderboard.data.reduce((acc: number, c: any) => acc + (c.benchmark_vs_nifty50 || 0), 0) / (leaderboard.data.length || 1)).toFixed(1)
      : 0
  }

  const statCards = [
    { icon: Globe, label: 'Companies Analyzed', value: stats.companies, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { icon: Leaf, label: 'Average ESG Score', value: stats.avgESG, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { icon: Users, label: 'ESG Leaders (70+)', value: stats.highESG, color: 'text-purple-600', bg: 'bg-purple-500/10' },
    { icon: TrendingUp, label: 'Avg Outperformance', value: `+${stats.avgOutperformance}%`, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">ESG Leaderboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Top BSE companies by ESG performance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2 md:pb-3">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
              </div>
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground line-clamp-1">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-xl md:text-2xl lg:text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-lg md:text-xl">All Companies</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Leaderboard />
        </CardContent>
      </Card>
    </div>
  )
}
