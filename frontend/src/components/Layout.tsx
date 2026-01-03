import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import {
  PieChart, LogOut, Menu, X,
  Leaf, TrendingUp, Globe
} from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/', label: 'Home', icon: Globe },
    { path: '/dashboard', label: 'Leaderboard', icon: TrendingUp },
    { path: '/portfolio', label: 'Portfolio', icon: PieChart },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="hidden sm:inline">GreenVested</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 lg:gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:text-emerald-600 ${
                  location.pathname === item.path 
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' 
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            <DarkModeToggle />
            {isLoading ? (
              <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
            ) : user ? (
              <div className="flex items-center gap-2 lg:gap-4">
                <span className="hidden lg:block text-sm text-muted-foreground max-w-[150px] truncate">
                  {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs lg:text-sm">
                  <LogOut className="h-3.5 w-3.5 lg:mr-1.5" />
                  <span className="hidden lg:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="text-xs lg:text-sm">
                  <span className="hidden sm:inline">Sign In</span>
                  <span className="sm:hidden">Sign In</span>
                </Button>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <DarkModeToggle />
            <button
              className="p-2 rounded-lg hover:bg-muted"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path 
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 border-t space-y-2">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      {user.email}
                    </div>
                    <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Sign In</Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        {children}
      </main>

      <footer className="border-t py-6 md:py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <p className="font-semibold text-foreground">GreenVested</p>
              <p className="text-sm text-muted-foreground">AI-Powered ESG Investing Platform</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm text-muted-foreground">
              <Link to="/dashboard" className="hover:text-emerald-600 transition-colors">Leaderboard</Link>
              <Link to="/portfolio" className="hover:text-emerald-600 transition-colors">Portfolio</Link>
              <a href="#" className="hover:text-emerald-600 transition-colors">About</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
            <p>Built with FastAPI + React + Tailwind</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
