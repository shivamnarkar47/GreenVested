import { useEffect, useState } from 'react'
import { DollarSign } from 'lucide-react'

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    const duration = 5500
    const interval = 30
    const steps = duration / interval
    const increment = 100 / steps

    const startTimeout = setTimeout(() => {
      const timer = setInterval(() => {
        setProgress(prev => {
          const next = prev + increment
          if (next >= 100) {
            clearInterval(timer)
            setTimeout(onComplete, 300)
            return 100
          }
          return next
        })
      }, interval)

      return () => clearInterval(timer)
    }, 100)

    setTimeout(() => setShowText(true), 600)

    return () => {
      clearTimeout(startTimeout)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <div className="relative">
        <div className="w-32 h-32 relative">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${progress * 3.52} 352`}
              className="text-emerald-500 transition-all duration-30 ease-linear"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <DollarSign className="w-12 h-12 text-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-4xl font-bold text-foreground font-mono">
          {Math.round(progress)}%
        </p>
        <p className={`text-sm text-muted-foreground mt-2 transition-opacity duration-500 ${
          showText ? 'opacity-100' : 'opacity-0'
        }`}>
          Loading GreenVested...
        </p>
      </div>

      <div className="mt-12 w-64 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-30 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
