import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateGardenModal } from './CreateGardenModal'
import { GardenCard } from './GardenCard'
import { AddPlantModal } from '../plants/AddPlantModal'
import { Sprout, Calendar, BarChart3, Plus } from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

interface Garden {
  id: string
  name: string
  location: string
  growZone: string
  size?: string
  description?: string
  createdAt: string
  plantCount?: number
}

interface GardenPlant {
  id: string
  gardenId: string
  plantId: string
  userId: string
  plantedDate: string
  status: string
  plant?: {
    name: string
    plantType: string
    daysToMaturity: number
  }
}

export function GardensPage() {
  const [gardens, setGardens] = useState<Garden[]>([])
  const [gardenPlants, setGardenPlants] = useState<GardenPlant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGardenForPlant, setSelectedGardenForPlant] = useState<{ id: string; zone: string } | null>(null)
  const { toast } = useToast()

  const loadGardens = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const gardensData = await blink.db.gardens.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      
      // Count plants for each garden
      const gardensWithCounts = await Promise.all(
        gardensData.map(async (garden) => {
          try {
            const plants = await blink.db.gardenPlants.list({
              where: { gardenId: garden.id }
            })
            return { ...garden, plantCount: plants.length }
          } catch (error) {
            console.error('Error counting plants for garden:', garden.id, error)
            return { ...garden, plantCount: 0 }
          }
        })
      )
      
      setGardens(gardensWithCounts)
    } catch (error) {
      console.error('Error loading gardens:', error)
      toast({
        title: "Error",
        description: "Failed to load gardens.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadGardenPlants = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const plantsData = await blink.db.gardenPlants.list({
        where: { userId: user.id },
        orderBy: { plantedDate: 'desc' }
      })
      setGardenPlants(plantsData)
    } catch (error) {
      console.error('Error loading garden plants:', error)
    }
  }, [])

  useEffect(() => {
    loadGardens()
    loadGardenPlants()
  }, [loadGardens, loadGardenPlants])

  const handleAddPlant = (gardenId: string) => {
    const garden = gardens.find(g => g.id === gardenId)
    if (garden) {
      setSelectedGardenForPlant({ id: gardenId, zone: garden.growZone })
    }
  }

  const handleManageGarden = (gardenId: string) => {
    // TODO: Implement garden management modal
    toast({
      title: "Coming Soon",
      description: "Garden management features will be available soon!"
    })
  }

  const handleGardenCreated = () => {
    loadGardens()
  }

  const handlePlantAdded = () => {
    loadGardens()
    loadGardenPlants()
    setSelectedGardenForPlant(null)
  }

  const getRecentPlants = () => {
    return gardenPlants.slice(0, 5)
  }

  const getUpcomingTasks = () => {
    // Mock upcoming tasks - in a real app, this would be calculated based on planting schedules
    return [
      { id: '1', task: 'Start tomato seeds indoors', date: 'March 15', garden: 'Main Garden' },
      { id: '2', task: 'Direct sow lettuce', date: 'March 20', garden: 'Herb Garden' },
      { id: '3', task: 'Transplant peppers', date: 'April 1', garden: 'Main Garden' },
    ]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Sprout className="w-8 h-8 mx-auto mb-2 text-green-600 animate-pulse" />
          <p className="text-gray-600">Loading your gardens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-800">My Gardens</h1>
          <p className="text-gray-600 mt-1">Manage your gardens and track your plants</p>
        </div>
        <CreateGardenModal onGardenCreated={handleGardenCreated} />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gardens">Gardens</TabsTrigger>
          <TabsTrigger value="plants">Plants</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Gardens</CardTitle>
                <Sprout className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{gardens.length}</div>
                <p className="text-xs text-gray-600">Active growing spaces</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Plants</CardTitle>
                <BarChart3 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{gardenPlants.length}</div>
                <p className="text-xs text-gray-600">Plants being tracked</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Tasks</CardTitle>
                <Calendar className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{getUpcomingTasks().length}</div>
                <p className="text-xs text-gray-600">Tasks this month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-green-800">Recent Plants</CardTitle>
              </CardHeader>
              <CardContent>
                {getRecentPlants().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Sprout className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No plants added yet</p>
                    <p className="text-sm">Start by creating a garden and adding some plants!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getRecentPlants().map((plant) => (
                      <div key={plant.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800">{plant.plant?.name || 'Unknown Plant'}</p>
                          <p className="text-sm text-gray-600">{plant.plant?.plantType}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(plant.plantedDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-green-800">Upcoming Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getUpcomingTasks().map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div>
                        <p className="font-medium text-amber-800">{task.task}</p>
                        <p className="text-sm text-gray-600">{task.garden}</p>
                      </div>
                      <div className="text-sm text-amber-600 font-medium">
                        {task.date}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gardens" className="space-y-6">
          {gardens.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Sprout className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Gardens Yet</h3>
                <p className="text-gray-600 mb-6">Create your first garden to start tracking your plants!</p>
                <CreateGardenModal onGardenCreated={handleGardenCreated} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gardens.map((garden) => (
                <GardenCard
                  key={garden.id}
                  garden={garden}
                  onAddPlant={handleAddPlant}
                  onManage={handleManageGarden}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plants" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-green-800">All Plants</h2>
            {gardens.length > 0 && (
              <Button
                onClick={() => gardens.length > 0 && handleAddPlant(gardens[0].id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Plant
              </Button>
            )}
          </div>

          {gardenPlants.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Sprout className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Plants Yet</h3>
                <p className="text-gray-600 mb-6">Add some plants to your gardens to start tracking them!</p>
                {gardens.length > 0 ? (
                  <Button
                    onClick={() => handleAddPlant(gardens[0].id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Plant
                  </Button>
                ) : (
                  <CreateGardenModal onGardenCreated={handleGardenCreated} />
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gardenPlants.map((plant) => (
                <Card key={plant.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-green-800">{plant.plant?.name || 'Unknown Plant'}</h3>
                        <p className="text-sm text-gray-600">{plant.plant?.plantType}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {plant.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Planted: {new Date(plant.plantedDate).toLocaleDateString()}</p>
                      {plant.plant?.daysToMaturity && (
                        <p>Days to maturity: {plant.plant.daysToMaturity}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedGardenForPlant && (
        <AddPlantModal
          open={!!selectedGardenForPlant}
          onOpenChange={(open) => !open && setSelectedGardenForPlant(null)}
          gardenId={selectedGardenForPlant.id}
          gardenZone={selectedGardenForPlant.zone}
          onPlantAdded={handlePlantAdded}
        />
      )}
    </div>
  )
}