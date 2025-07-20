import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Sprout, 
  Calendar, 
  Thermometer, 
  Plus,
  TrendingUp,
  MapPin
} from 'lucide-react'
import { blink } from '@/blink/client'

interface Garden {
  id: string
  name: string
  location: string
  growZone: string
  plantCount: number
  createdAt: string
}

interface PlantingTask {
  id: string
  plantName: string
  taskType: 'sow' | 'transplant' | 'harvest'
  dueDate: string
  gardenName: string
}

export function Dashboard() {
  const [gardens, setGardens] = useState<Garden[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<PlantingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      // Load gardens
      const gardensData = await blink.db.gardens.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 6
      })
      setGardens(gardensData || [])

      // Load upcoming tasks
      const tasksData = await blink.db.plantingTasks.list({
        where: { userId: user.id },
        orderBy: { dueDate: 'asc' },
        limit: 5
      })
      setUpcomingTasks(tasksData || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user && !state.isLoading) {
        loadDashboardData()
      }
    })
    return unsubscribe
  }, [loadDashboardData])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'sow': return 'bg-green-100 text-green-800'
      case 'transplant': return 'bg-blue-100 text-blue-800'
      case 'harvest': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 animate-pulse mb-1" />
                <div className="h-3 bg-muted rounded w-24 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's what's happening in your gardens today.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Garden
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gardens</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gardens.length}</div>
            <p className="text-xs text-muted-foreground">
              Active growing spaces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plants Growing</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gardens.reduce((sum, garden) => sum + garden.plantCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all gardens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weather</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72°F</div>
            <p className="text-xs text-muted-foreground">
              Perfect for planting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Gardens */}
        <Card>
          <CardHeader>
            <CardTitle>Your Gardens</CardTitle>
            <CardDescription>
              Manage your growing spaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gardens.length === 0 ? (
              <div className="text-center py-8">
                <Sprout className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No gardens yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first garden to start tracking your plants
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Garden
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {gardens.map((garden) => (
                  <div key={garden.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Sprout className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{garden.name}</h4>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {garden.location} • Zone {garden.growZone}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{garden.plantCount} plants</div>
                      <div className="text-sm text-muted-foreground">
                        Created {formatDate(garden.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>
              Don't miss these important planting activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tasks scheduled</h3>
                <p className="text-muted-foreground">
                  Add plants to your gardens to see planting schedules
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getTaskTypeColor(task.taskType)}>
                        {task.taskType}
                      </Badge>
                      <div>
                        <div className="font-medium">{task.plantName}</div>
                        <div className="text-sm text-muted-foreground">
                          in {task.gardenName}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formatDate(task.dueDate)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Growing Season Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Growing Season Progress</CardTitle>
          <CardDescription>
            Track your progress through the current growing season
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Spring Planting</span>
              <span className="text-sm text-muted-foreground">75% Complete</span>
            </div>
            <Progress value={75} className="h-2" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">12</div>
                <div className="text-xs text-muted-foreground">Seeds Sown</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">8</div>
                <div className="text-xs text-muted-foreground">Transplanted</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">3</div>
                <div className="text-xs text-muted-foreground">Ready to Harvest</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}