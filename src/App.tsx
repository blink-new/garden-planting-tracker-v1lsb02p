import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { GardensPage } from '@/components/gardens/GardensPage'
import { blink } from '@/blink/client'
import { Toaster } from '@/components/ui/toaster'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your garden...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Welcome to Garden Tracker
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Track your gardens, get personalized planting schedules, and never miss the perfect time to sow your favorite fruits and vegetables.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 border rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="font-semibold mb-2">Smart Scheduling</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized planting schedules based on your location and grow zone
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📍</span>
                </div>
                <h3 className="font-semibold mb-2">Location-Based</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic grow zone detection for optimal planting recommendations
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="font-semibold mb-2">Track Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor your gardens and track your growing season progress
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'gardens':
        return <GardensPage />
      case 'library':
        return (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Plant Library</h2>
            <p className="text-muted-foreground">Coming soon - Browse plants and growing information</p>
          </div>
        )
      case 'calendar':
        return (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Planting Calendar</h2>
            <p className="text-muted-foreground">Coming soon - View your planting schedule</p>
          </div>
        )
      case 'settings':
        return (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p className="text-muted-foreground">Coming soon - Manage your preferences</p>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}

export default App