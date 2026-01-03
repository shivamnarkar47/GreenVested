import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import type { CompanyWithScore } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, ArrowUpRight, Search } from 'lucide-react'
import { useState, useMemo } from 'react'

interface LeaderboardProps {
  showTopOnly?: boolean
  limit?: number
}

export default function Leaderboard({ showTopOnly = false, limit = 50 }: LeaderboardProps) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [sectorFilter, setSectorFilter] = useState<string | null>(null)

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => api.getLeaderboard(undefined, limit)
  })

  const sectors: string[] = useMemo(() => {
    if (!leaderboard?.data) return []
    return [...new Set(leaderboard.data.map((c: CompanyWithScore) => c.sector).filter(Boolean))] as string[]
  }, [leaderboard])

  const filteredCompanies = useMemo(() => {
    if (!leaderboard?.data) return []
    
    let filtered = leaderboard.data.filter((c: CompanyWithScore) => {
      const matchesSearch = c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.bse_code.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSector = !sectorFilter || c.sector === sectorFilter
      return matchesSearch && matchesSector
    })
    
    filtered.sort((a: CompanyWithScore, b: CompanyWithScore) => {
      const aVal = a.esg_score || 0
      const bVal = b.esg_score || 0
      return bVal - aVal
    })
    
    return showTopOnly ? filtered.slice(0, 5) : filtered
  }, [leaderboard, searchTerm, sectorFilter, showTopOnly])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 70) return 'bg-blue-500'
    if (score >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-10 md:h-12 bg-muted animate-pulse rounded-lg" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 md:h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-sm"
          />
        </div>
        <select
          value={sectorFilter || ''}
          onChange={(e) => setSectorFilter(e.target.value || null)}
          className="px-3 py-2.5 rounded-lg border bg-background text-sm min-w-[140px]"
        >
          <option value="">All Sectors</option>
          {sectors.map((s: string) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2 md:space-y-3">
        {filteredCompanies.map((company: CompanyWithScore) => (
          <Card
            key={company.bse_code}
            className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/50 hover:border-emerald-500/30"
            onClick={() => navigate(`/company/${company.bse_code}`)}
          >
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-bold text-white text-sm md:text-base flex-shrink-0 ${getScoreColor(company.esg_score || 0)}`}>
                    {company.esg_score?.toFixed(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm md:text-base truncate">{company.company_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="truncate">{company.bse_code}</span>
                      <Badge variant="secondary" className="text-xs flex-shrink-0 hidden sm:inline-flex">
                        {company.sector}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
                  <div className="hidden sm:block text-center min-w-[70px]">
                    <p className="text-xs text-muted-foreground">E / S / G</p>
                    <p className="text-sm font-medium">
                      {company.e_score} / {company.s_score} / {company.g_score}
                    </p>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <p className="text-xs text-muted-foreground hidden md:block">Pred. Return</p>
                    <div className="flex items-center gap-1 justify-end">
                      <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-500 flex-shrink-0" />
                      <span className="font-semibold text-emerald-600 text-sm md:text-base">
                        +{company.predicted_return?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCompanies.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No companies found matching your criteria
          </div>
        )}
      </div>
    </div>
  )
}
