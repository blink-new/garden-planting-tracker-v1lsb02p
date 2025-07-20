import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Calendar, Thermometer, Droplets } from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

interface Plant {
  id: string
  name: string
  type: string
  description: string
  daysToMaturity: number
  spacing: string
  sunRequirement: string
  waterRequirement: string
}

interface PlantingSchedule {
  id: string
  plantId: string
  growZone: string
  sowIndoorsStart: string
  sowIndoorsEnd: string
  transplantStart: string
  transplantEnd: string
  directSowStart: string
  directSowEnd: string
  harvestStart: string
  harvestEnd: string
}

interface AddPlantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gardenId: string
  gardenZone: string
  onPlantAdded: () => void
}

export function AddPlantModal({ open, onOpenChange, gardenId, gardenZone, onPlantAdded }: AddPlantModalProps) {
  const [plants, setPlants] = useState<Plant[]>([])
  const [schedules, setSchedules] = useState<PlantingSchedule[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const [loading, setLoading] = useState(false)
  const [addingPlant, setAddingPlant] = useState(false)
  const { toast } = useToast()

  const loadPlants = useCallback(async () => {
    setLoading(true)
    try {
      const plantsData = await blink.db.plants.list()
      setPlants(plantsData)
    } catch (error) {
      console.error('Error loading plants:', error)
      toast({
        title: "Error",
        description: "Failed to load plants.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadSchedules = useCallback(async () => {
    try {
      const schedulesData = await blink.db.plantingSchedules.list({
        where: { growZone: gardenZone }
      })
      setSchedules(schedulesData)
    } catch (error) {
      console.error('Error loading schedules:', error)
    }
  }, [gardenZone])

  useEffect(() => {
    if (open) {
      loadPlants()
      loadSchedules()
    }
  }, [open, loadPlants, loadSchedules])

  const filteredPlants = plants.filter(plant =>
    plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPlantSchedule = (plantId: string) => {
    return schedules.find(s => s.plantId === plantId)
  }

  const addPlantToGarden = async () => {
    if (!selectedPlant) return

    setAddingPlant(true)
    try {
      const user = await blink.auth.me()
      await blink.db.gardenPlants.create({
        gardenId,
        plantId: selectedPlant.id,
        userId: user.id,
        plantedDate: new Date().toISOString(),
        status: 'planned'
      })

      toast({
        title: "Plant Added!",
        description: `${selectedPlant.name} has been added to your garden.`
      })

      onPlantAdded()
      onOpenChange(false)
      setSelectedPlant(null)
      setSearchTerm('')
    } catch (error) {
      console.error('Error adding plant:', error)
      toast({
        title: "Error",
        description: "Failed to add plant to garden.",
        variant: "destructive"
      })
    } finally {
      setAddingPlant(false)
    }
  }

  const formatDateRange = (start: string, end: string) => {
    if (!start || !end) return 'Not specified'
    return `${start} - ${end}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-green-800">Add Plant to Garden</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search plants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading plants...</div>
            ) : filteredPlants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No plants found matching your search.' : 'No plants available.'}
              </div>
            ) : (
              filteredPlants.map((plant) => {
                const schedule = getPlantSchedule(plant.id)
                const isSelected = selectedPlant?.id === plant.id
                
                return (
                  <Card
                    key={plant.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'ring-2 ring-green-500 bg-green-50' 
                        : 'hover:shadow-md border-gray-200'
                    }`}
                    onClick={() => setSelectedPlant(isSelected ? null : plant)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-green-800">{plant.name}</h3>
                          <Badge variant="outline" className="mt-1">
                            {plant.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {plant.daysToMaturity} days
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{plant.description}</p>

                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div className="flex items-center">
                          <Thermometer className="w-3 h-3 mr-1 text-orange-500" />
                          <span>{plant.sunRequirement}</span>
                        </div>
                        <div className="flex items-center">
                          <Droplets className="w-3 h-3 mr-1 text-blue-500" />
                          <span>{plant.waterRequirement}</span>
                        </div>
                        <div className="text-gray-600">
                          Spacing: {plant.spacing}
                        </div>
                      </div>

                      {schedule && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-600 space-y-1">
                            <div><strong>Indoor Start:</strong> {formatDateRange(schedule.sowIndoorsStart, schedule.sowIndoorsEnd)}</div>
                            <div><strong>Direct Sow:</strong> {formatDateRange(schedule.directSowStart, schedule.directSowEnd)}</div>
                            <div><strong>Harvest:</strong> {formatDateRange(schedule.harvestStart, schedule.harvestEnd)}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={addPlantToGarden}
              disabled={!selectedPlant || addingPlant}
              className="bg-green-600 hover:bg-green-700"
            >
              {addingPlant ? 'Adding...' : 'Add to Garden'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}