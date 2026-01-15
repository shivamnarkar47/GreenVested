import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import InteractiveMap from '@/components/gis/InteractiveMap'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Globe, TrendingUp, Award } from 'lucide-react'
import { useState } from 'react'

interface StateAggregate {
  state: string
  company_count: number
  avg_esg_score: number
  avg_e_score: number
  avg_s_score: number
  avg_g_score: number
  top_company?: string
  lowest_company?: string
}

interface RegionalComparison {
  state: string
  esg_score: number
  national_avg: number
  deviation: number
  rank: number
  total_states: number
}

export default function GeographicDashboard() {
  const [selectedState, setSelectedState] = useState<string | undefined>()

  const { data: stateAggregates } = useQuery({
    queryKey: ['gis-states'],
    queryFn: () => api.getGISStates()
  })

  const { data: companyLocations } = useQuery({
    queryKey: ['gis-companies'],
    queryFn: () => api.getGISCompanyLocations()
  })

  const { data: regionalComparison } = useQuery({
    queryKey: ['gis-regional-comparison'],
    queryFn: () => api.getGISRegionalComparison()
  })

  const selectedStateData = stateAggregates?.find((s: StateAggregate) => s.state === selectedState)

  const stats = {
    statesCovered: stateAggregates?.length || 0,
    companiesMapped: companyLocations?.length || 0,
    topState: stateAggregates?.[0]?.state || '',
    topStateScore: stateAggregates?.[0]?.avg_esg_score || 0
  }

  const statCards = [
    { icon: Globe, label: 'States Covered', value: stats.statesCovered, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { icon: MapPin, label: 'Companies Mapped', value: stats.companiesMapped, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { icon: Award, label: 'Top State', value: stats.topState, color: 'text-purple-600', bg: 'bg-purple-500/10' },
    { icon: TrendingUp, label: 'Top ESG Score', value: `${stats.topStateScore}`, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Geographic ESG Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Interactive map showing ESG performance across Indian states
          </p>
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
              <p className={`text-xl md:text-2xl lg:text-3xl font-bold ${stat.color} truncate`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Interactive Map */}
         <div className="lg:col-span-2">
           <Card className="h-full">
             <CardHeader className="pb-2">
               <CardTitle className="flex items-center gap-2">
                 <MapPin className="h-5 w-5" />
                 ESG Performance Map
               </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
               <InteractiveMap
                 companies={companyLocations || []}
                 stateAggregates={stateAggregates || []}
                 selectedState={selectedState}
                 onStateClick={setSelectedState}
                 height="calc(100vh - 200px)"
               />
             </CardContent>
           </Card>
         </div>

        {/* State Details & Rankings */}
        <div className="space-y-6">
          {/* Selected State Details */}
          {selectedStateData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedStateData.state}</span>
                  <Badge variant="secondary">
                    ESG: {selectedStateData.avg_esg_score}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Companies</p>
                    <p className="text-2xl font-bold">{selectedStateData.company_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg ESG</p>
                    <p className="text-2xl font-bold">{selectedStateData.avg_esg_score}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>E Score:</span>
                    <span className="font-medium">{selectedStateData.avg_e_score}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>S Score:</span>
                    <span className="font-medium">{selectedStateData.avg_s_score}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>G Score:</span>
                    <span className="font-medium">{selectedStateData.avg_g_score}</span>
                  </div>
                </div>

                {selectedStateData.top_company && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Top Performer</p>
                    <p className="font-medium">{selectedStateData.top_company}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* State Rankings */}
          <Card>
            <CardHeader>
              <CardTitle>State Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {regionalComparison?.slice(0, 10).map((state: RegionalComparison) => (
                  <div
                    key={state.state}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedState === state.state
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedState(state.state)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {state.rank}
                      </div>
                      <div>
                        <p className="font-medium">{state.state}</p>
                        <p className="text-sm text-muted-foreground">
                          {state.deviation >= 0 ? '+' : ''}{state.deviation} vs national avg
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{state.esg_score}</p>
                      <Badge
                        variant={state.deviation >= 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {state.deviation >= 0 ? 'Above' : 'Below'} Avg
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}