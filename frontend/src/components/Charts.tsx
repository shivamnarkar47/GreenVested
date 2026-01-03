import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, AreaChart, Area
} from 'recharts'

interface ESGChartsProps {
  eScore: number
  sScore: number
  gScore: number
  companyName: string
}

const CustomTooltip = ({ active, payload, label, unit = '' }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value
    const isPositive = value >= 0
    return (
      <div className="bg-popover border border-border/50 rounded-lg shadow-xl p-3 backdrop-blur-md">
        <p className="text-sm text-muted-foreground mb-1">Day {label}</p>
        <p className={`text-lg font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {value >= 0 ? '+' : ''}{value.toFixed(2)}{unit}
        </p>
      </div>
    )
  }
  return null
}

export function ESGComparisonChart({ data }: { data: { name: string; ESG: number; E: number; S: number; G: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <YAxis domain={[0, 100]} className="text-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            backdropFilter: 'blur(8px)'
          }}
          labelStyle={{ color: 'var(--muted-foreground)' }}
        />
        <Legend />
        <Bar dataKey="ESG" fill="#10b981" />
        <Bar dataKey="E" fill="#3b82f6" />
        <Bar dataKey="S" fill="#8b5cf6" />
        <Bar dataKey="G" fill="#f59e0b" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ESGRadarChart({ eScore, sScore, gScore, companyName }: ESGChartsProps) {
  const data = [
    { subject: 'Environmental', A: eScore, fullMark: 100 },
    { subject: 'Social', A: sScore, fullMark: 100 },
    { subject: 'Governance', A: gScore, fullMark: 100 },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid className="stroke-muted" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} className="stroke-muted" />
        <Radar
          name={companyName}
          dataKey="A"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.5}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            backdropFilter: 'blur(8px)'
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function ScoreBreakdown({ eScore, sScore, gScore }: Omit<ESGChartsProps, 'companyName'>) {
  const data = [
    { name: 'Environmental', value: eScore, color: '#3b82f6' },
    { name: 'Social', value: sScore, color: '#8b5cf6' },
    { name: 'Governance', value: gScore, color: '#f59e0b' },
  ]

  const esgScore = Math.round((eScore * 0.35 + sScore * 0.30 + gScore * 0.35))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold text-white ${
          esgScore >= 80 ? 'bg-emerald-500' : esgScore >= 70 ? 'bg-blue-500' : esgScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
        }`}>
          {esgScore}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              backdropFilter: 'blur(8px)'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MonteCarloChart({ data }: { data: number[] }) {
  const chartData = data.map((value, index) => ({
    day: index,
    return: value
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="monteCarloGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="day" className="text-muted-foreground" />
        <YAxis className="text-muted-foreground" tickFormatter={(v) => `${v.toFixed(1)}%`} />
        <Tooltip content={<CustomTooltip unit="%" />} />
        <Area
          type="monotone"
          dataKey="return"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#monteCarloGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
