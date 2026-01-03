import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Leaderboard from '@/components/Leaderboard'
import { useEffect, useState } from 'react'
import {
  TrendingUp, ArrowRight,
  PieChart, BarChart3, DollarSign, Activity,
  Sparkles, Target, TrendingUpIcon
} from 'lucide-react'

function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    const totalFrames = Math.ceil(duration / 16)
    const increment = end / totalFrames

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value, duration])

  return <span>{count.toLocaleString()}</span>
}

function HeroAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute text-emerald-500/20 animate-float hidden sm:block"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`
          }}
        >
          <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
        </div>
      ))}
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description, gradient }: {
  icon: any
  title: string
  description: string
  gradient: string
}) {
  return (
    <Card className="relative overflow-hidden border-0 bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${gradient}`} />
      <CardContent className="p-5 md:p-6 relative z-10">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:rotate-2 transition-all duration-300">
          <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
        </div>
        <h3 className="text-lg md:text-xl font-bold mb-2 group-hover:text-emerald-600 transition-colors">{title}</h3>
        <p className="text-sm md:text-base text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function Landing() {
  return (
    <div className="relative">
      <HeroAnimation />

      <section className="relative min-h-[85vh] flex items-center justify-center py-16 md:py-20 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 text-xs md:text-sm font-medium mb-6 md:mb-8 animate-fade-in-up">
              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>AI-Powered ESG Analysis for Indian Markets</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-4 md:mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Invest in a{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                  Sustainable
                </span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M0,8 Q50,12 100,8 T200,8" stroke="url(#gradient)" strokeWidth="3" fill="none" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              {' '}Future
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Get real-time ESG scores for 500+ BSE-listed companies.
              Make data-driven investment decisions with AI-powered analysis.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-10 md:mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/dashboard">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-sm md:text-base px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 shadow-lg shadow-emerald-500/25">
                  <TrendingUpIcon className="h-4 w-4 md:h-5 md:w-5" />
                  <span>View Leaderboard</span>
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </Link>
              <Link to="/portfolio">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 text-sm md:text-base px-6 md:px-8 py-5 md:py-6 hover:bg-emerald-500/10">
                  <PieChart className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Portfolio Simulator</span>
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              {[
                { icon: DollarSign, label: 'Companies', value: 500, suffix: '+' },
                { icon: Activity, label: 'ESG Factors', value: 50, suffix: '+' },
                { icon: Target, label: 'Avg Premium', value: 12, suffix: '%' },
                { icon: Sparkles, label: 'Accuracy', value: 87, suffix: '%' },
              ].map((stat, i) => (
                <div key={i} className="p-3 md:p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-emerald-500" />
                  <p className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                    <AnimatedCounter value={stat.value} />{stat.suffix}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 hidden md:block animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-emerald-500 rounded-full" />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">Powerful Features</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to make smarter, more sustainable investment decisions
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <FeatureCard
              icon={BarChart3}
              title="AI ESG Scoring"
              description="Advanced NLP algorithms analyze Environmental, Social, and Governance factors using Gemini AI."
              gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
            />
            <FeatureCard
              icon={TrendingUp}
              title="ML Predictions"
              description="Machine learning models predict 1-year returns based on ESG scores, showing avg +12% outperformance."
              gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={PieChart}
              title="Portfolio Simulator"
              description="Build and analyze portfolios with Monte Carlo simulations and ESG-adjusted returns."
              gradient="bg-gradient-to-br from-purple-500 to-pink-500"
            />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
                Why ESG Investing Matters
              </h2>
              <div className="space-y-4 md:space-y-6">
                {[
                  { title: 'Risk Mitigation', desc: 'Companies with strong ESG practices face lower regulatory and reputational risks' },
                  { title: 'Long-term Value', desc: 'Sustainable companies show better long-term financial performance' },
                  { title: 'Market Outperformance', desc: 'High-ESG portfolios consistently beat benchmarks over 5+ year periods' },
                  { title: 'Future-Proof Investing', desc: 'Align your portfolio with global sustainability trends' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                      <Target className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base md:text-lg mb-1">{item.title}</h3>
                      <p className="text-sm md:text-base text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl lg:rounded-3xl blur-2xl opacity-20" />
              <Card className="relative bg-background/80 backdrop-blur-xl border-0 shadow-xl">
                <CardContent className="p-5 md:p-6 lg:p-8">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <span className="text-sm text-muted-foreground">Portfolio ESG Score</span>
                    <span className="text-2xl md:text-3xl font-bold text-emerald-500">85/100</span>
                  </div>
                  <div className="h-3 md:h-4 bg-muted rounded-full overflow-hidden mb-5 md:mb-6">
                    <div className="h-full w-[85%] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-6">
                    <div className="text-center p-3 md:p-4 bg-blue-500/10 rounded-xl">
                      <p className="text-xl md:text-2xl font-bold text-blue-500">82</p>
                      <p className="text-xs text-muted-foreground">Environmental</p>
                    </div>
                    <div className="text-center p-3 md:p-4 bg-purple-500/10 rounded-xl">
                      <p className="text-xl md:text-2xl font-bold text-purple-500">86</p>
                      <p className="text-xs text-muted-foreground">Social</p>
                    </div>
                    <div className="text-center p-3 md:p-4 bg-amber-500/10 rounded-xl">
                      <p className="text-xl md:text-2xl font-bold text-amber-500">87</p>
                      <p className="text-xs text-muted-foreground">Governance</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">ESG-Adjusted Return</span>
                    <span className="font-bold text-emerald-500">+14.2%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 md:mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Top ESG Performers</h2>
              <p className="text-sm md:text-base text-muted-foreground">Leading Indian companies by ESG score</p>
            </div>
            <Link to="/dashboard">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <Leaderboard showTopOnly limit={5} />
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjMCAwLTItMi0yLTRzMi00IDItNCAyIDIgNCAyczQgMiA0IDQtMiA0LTIgNC0yIDItNCAyYzAgMC0yIDItMiA0czIgNCAyIDQiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-white">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">Start Your Sustainable Investment Journey</h2>
            <p className="text-base md:text-lg lg:text-xl text-white/80 mb-8 md:mb-10 max-w-2xl mx-auto">
              Join thousands of investors using GreenVested to make smarter,
              more sustainable investment decisions.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-sm md:text-base px-8 md:px-10 py-5 md:py-6 bg-white text-emerald-600 hover:bg-white/90 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105">
                Create Free Account
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
