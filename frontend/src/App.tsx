import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import Layout from '@/components/Layout'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import GeographicDashboard from '@/pages/GeographicDashboard'
import Company from '@/pages/Company'
import Portfolio from '@/pages/Portfolio'
// import AuthPage from '@/pages/AuthPage'
import { LoadingScreen } from '@/components/LoadingScreen'
import { useState, useEffect } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})

function App() {
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false)
    }, 6000)
    return () => clearTimeout(timer)
  }, [])

  if (showLoading) {
    return <LoadingScreen onComplete={() => setShowLoading(false)} />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/geographic" element={<GeographicDashboard />} />
                <Route path="/company/:bseCode" element={<Company />} />
                <Route path="/portfolio" element={<Portfolio />} />
                {/* <Route path="/auth" element={<AuthPage />} /> */}
              </Routes>
            </Layout>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
