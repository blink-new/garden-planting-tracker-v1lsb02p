import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, Calendar, Thermometer, Droplets, Leaf, Info } from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

interface Plant {
  id: string
  name: string
  scientificName?: string
  plantType: string
  category: string
  daysToMaturity: number
  spacingInches: number
  sunRequirements: string
  waterRequirements: string
  soilPhMin?: number
  soilPhMax?: number
  frostTolerance?: string
}

interface PlantingSchedule {
  id: string
  plantId: string
  growZone: string
  sowIndoorStart: string
  sowIndoorEnd: string
  transplantStart: string
  transplantEnd: string
  sowOutdoorStart: string
  sowOutdoorEnd: string
  harvestStart: string
  harvestEnd: string
}

export function PlantLibrary() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [schedules, setSchedules] = useState<PlantingSchedule[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const { toast } = useToast()

  const loadPlants = useCallback(async () => {
    setLoading(true)
    try {
      const plantsData = await blink.db.plants.list({
        orderBy: { name: 'asc' }
      })
      setPlants(plantsData)
    } catch (error) {
      console.error('Error loading plants:', error)
      toast({
        title: "Error",
        description: "Failed to load plant library.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadSchedules = useCallback(async () => {
    try {
      const schedulesData = await blink.db.plantingSchedules.list()
      setSchedules(schedulesData)
    } catch (error) {
      console.error('Error loading schedules:', error)
    }
  }, [])

  useEffect(() => {
    loadPlants()
    loadSchedules()
  }, [loadPlants, loadSchedules])

  const filteredPlants = plants.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plant.plantType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (plant.category && plant.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (plant.scientificName && plant.scientificName.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = selectedType === 'all' || plant.plantType === selectedType
    const matchesCategory = selectedCategory === 'all' || plant.category === selectedCategory
    
    return matchesSearch && matchesType && matchesCategory
  })

  const plantTypes = [...new Set(plants.map(p => p.plantType))].sort()
  const categories = [...new Set(plants.map(p => p.category).filter(Boolean))].sort()

  const getPlantSchedules = (plantId: string) => {
    return schedules.filter(s => s.plantId === plantId)
  }

  const formatDateRange = (start: string, end: string) => {
    if (!start || !end) return 'Not specified'
    return `${start} - ${end}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Leaf className="w-8 h-8 mx-auto mb-2 text-green-600 animate-pulse" />
          <p className="text-gray-600">Loading plant library...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-800">Plant Library</h1>
          <p className="text-gray-600 mt-1">Browse our comprehensive collection of plants and growing information</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search plants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger>
            <SelectValue placeholder="Plant Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {plantTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-sm text-gray-600 flex items-center">
          Showing {filteredPlants.length} of {plants.length} plants
        </div>
      </div>

      {/* Plant Grid */}
      {filteredPlants.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Leaf className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Plants Found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlants.map((plant) => (
            <Card key={plant.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-green-800">{plant.name}</CardTitle>
                    {plant.scientificName && (
                      <p className="text-sm text-gray-500 italic mt-1">{plant.scientificName}</p>
                    )}
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedPlant(plant)}>
                        <Info className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl text-green-800">{plant.name}</DialogTitle>
                        {plant.scientificName && (
                          <p className="text-gray-500 italic">{plant.scientificName}</p>
                        )}
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Badge variant="outline">{plant.plantType}</Badge>
                          <Badge variant="secondary">{plant.category}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              <Calendar className="w-4 h-4 mr-2 text-green-600" />
                              <span className="font-medium">Days to Maturity:</span>
                              <span className="ml-1">{plant.daysToMaturity}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <Thermometer className="w-4 h-4 mr-2 text-orange-500" />
                              <span className="font-medium">Sun:</span>
                              <span className="ml-1">{plant.sunRequirements}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <Droplets className="w-4 h-4 mr-2 text-blue-500" />
                              <span className="font-medium">Water:</span>
                              <span className="ml-1">{plant.waterRequirements}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Spacing:</span>
                              <span className="ml-1">{plant.spacingInches}" apart</span>
                            </div>
                            {plant.soilPhMin && plant.soilPhMax && (
                              <div className="text-sm">
                                <span className="font-medium">Soil pH:</span>
                                <span className="ml-1">{plant.soilPhMin} - {plant.soilPhMax}</span>
                              </div>
                            )}
                            {plant.frostTolerance && (
                              <div className="text-sm">
                                <span className="font-medium">Frost Tolerance:</span>
                                <span className="ml-1">{plant.frostTolerance}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Planting Schedules */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-green-800">Planting Schedules by Zone</h4>
                          {getPlantSchedules(plant.id).length === 0 ? (
                            <p className="text-sm text-gray-500">No planting schedules available for this plant.</p>
                          ) : (
                            <div className="space-y-2">
                              {getPlantSchedules(plant.id).map((schedule) => (
                                <div key={schedule.id} className="border rounded-lg p-3 bg-gray-50">
                                  <div className="font-medium text-sm mb-2">Zone {schedule.growZone}</div>
                                  <div className="grid grid-cols-1 gap-1 text-xs">
                                    <div><strong>Indoor Start:</strong> {formatDateRange(schedule.sowIndoorStart, schedule.sowIndoorEnd)}</div>
                                    <div><strong>Direct Sow:</strong> {formatDateRange(schedule.sowOutdoorStart, schedule.sowOutdoorEnd)}</div>
                                    <div><strong>Transplant:</strong> {formatDateRange(schedule.transplantStart, schedule.transplantEnd)}</div>
                                    <div><strong>Harvest:</strong> {formatDateRange(schedule.harvestStart, schedule.harvestEnd)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex gap-2 mb-3">
                  <Badge variant="outline">{plant.plantType}</Badge>
                  <Badge variant="secondary">{plant.category}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1 text-green-600" />
                    <span>{plant.daysToMaturity}d</span>
                  </div>
                  <div className="flex items-center">
                    <Thermometer className="w-3 h-3 mr-1 text-orange-500" />
                    <span className="truncate">{plant.sunRequirements}</span>
                  </div>
                  <div className="flex items-center">
                    <Droplets className="w-3 h-3 mr-1 text-blue-500" />
                    <span className="truncate">{plant.waterRequirements}</span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-600">
                  Spacing: {plant.spacingInches}" apart
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}