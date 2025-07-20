import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronLeft, ChevronRight, Sprout, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

interface Garden {
  id: string
  name: string
  location: string
  growZone: string
}

interface Plant {
  id: string
  name: string
  plantType: string
  daysToMaturity: number
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

interface GardenPlant {
  id: string
  gardenId: string
  plantId: string
  plantedDate: string
  status: string
  plant?: Plant
}

interface CalendarEvent {
  id: string
  title: string
  type: 'sow-indoor' | 'sow-outdoor' | 'transplant' | 'harvest' | 'planted'
  date: string
  plant: string
  garden?: string
  description?: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const EVENT_COLORS = {
  'sow-indoor': 'bg-blue-100 text-blue-800 border-blue-200',
  'sow-outdoor': 'bg-green-100 text-green-800 border-green-200',
  'transplant': 'bg-purple-100 text-purple-800 border-purple-200',
  'harvest': 'bg-orange-100 text-orange-800 border-orange-200',
  'planted': 'bg-gray-100 text-gray-800 border-gray-200'
}

export function PlantingCalendar() {
  const [gardens, setGardens] = useState<Garden[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [schedules, setSchedules] = useState<PlantingSchedule[]>([])
  const [gardenPlants, setGardenPlants] = useState<GardenPlant[]>([])
  const [selectedGarden, setSelectedGarden] = useState<string>('all')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const user = await blink.auth.me()
      
      // Load gardens
      const gardensData = await blink.db.gardens.list({
        where: { userId: user.id }
      })
      setGardens(gardensData)

      // Load plants
      const plantsData = await blink.db.plants.list()
      setPlants(plantsData)

      // Load schedules
      const schedulesData = await blink.db.plantingSchedules.list()
      setSchedules(schedulesData)

      // Load garden plants
      const gardenPlantsData = await blink.db.gardenPlants.list({
        where: { userId: user.id }
      })
      setGardenPlants(gardenPlantsData)

    } catch (error) {
      console.error('Error loading calendar data:', error)
      toast({
        title: "Error",
        description: "Failed to load calendar data.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Generate calendar events
  useEffect(() => {
    const generateEvents = () => {
      const newEvents: CalendarEvent[] = []
      const currentYear = currentDate.getFullYear()

      // Add planted events
      gardenPlants.forEach(gardenPlant => {
        const garden = gardens.find(g => g.id === gardenPlant.gardenId)
        const plant = plants.find(p => p.id === gardenPlant.plantId)
        
        if (garden && plant && (selectedGarden === 'all' || selectedGarden === garden.id)) {
          newEvents.push({
            id: `planted-${gardenPlant.id}`,
            title: `Planted ${plant.name}`,
            type: 'planted',
            date: gardenPlant.plantedDate,
            plant: plant.name,
            garden: garden.name,
            description: `${plant.name} was planted in ${garden.name}`
          })

          // Add harvest event based on days to maturity
          if (plant.daysToMaturity) {
            const plantedDate = new Date(gardenPlant.plantedDate)
            const harvestDate = new Date(plantedDate)
            harvestDate.setDate(harvestDate.getDate() + plant.daysToMaturity)
            
            newEvents.push({
              id: `harvest-${gardenPlant.id}`,
              title: `Harvest ${plant.name}`,
              type: 'harvest',
              date: harvestDate.toISOString(),
              plant: plant.name,
              garden: garden.name,
              description: `Expected harvest date for ${plant.name} in ${garden.name}`
            })
          }
        }
      })

      // Add scheduled planting events for current year
      gardens.forEach(garden => {
        if (selectedGarden === 'all' || selectedGarden === garden.id) {
          schedules.forEach(schedule => {
            if (schedule.growZone === garden.growZone) {
              const plant = plants.find(p => p.id === schedule.plantId)
              if (!plant) return

              // Parse month-day format and create events for current year
              const addScheduleEvent = (startDate: string, endDate: string, type: CalendarEvent['type'], title: string) => {
                if (!startDate || !endDate) return

                try {
                  // Assuming format like "Mar 15" or "March 15"
                  const parseDate = (dateStr: string) => {
                    const [month, day] = dateStr.split(' ')
                    const monthIndex = MONTHS.findIndex(m => m.toLowerCase().startsWith(month.toLowerCase()))
                    if (monthIndex === -1) return null
                    return new Date(currentYear, monthIndex, parseInt(day))
                  }

                  const start = parseDate(startDate)
                  const end = parseDate(endDate)
                  
                  if (start && end) {
                    newEvents.push({
                      id: `${type}-${schedule.id}-start`,
                      title: `${title} ${plant.name} (Start)`,
                      type,
                      date: start.toISOString(),
                      plant: plant.name,
                      garden: garden.name,
                      description: `Optimal time to ${title.toLowerCase()} ${plant.name} in ${garden.name}`
                    })
                    
                    newEvents.push({
                      id: `${type}-${schedule.id}-end`,
                      title: `${title} ${plant.name} (End)`,
                      type,
                      date: end.toISOString(),
                      plant: plant.name,
                      garden: garden.name,
                      description: `Last optimal time to ${title.toLowerCase()} ${plant.name} in ${garden.name}`
                    })
                  }
                } catch (error) {
                  console.error('Error parsing date:', error)
                }
              }

              addScheduleEvent(schedule.sowIndoorStart, schedule.sowIndoorEnd, 'sow-indoor', 'Start Seeds Indoor')
              addScheduleEvent(schedule.sowOutdoorStart, schedule.sowOutdoorEnd, 'sow-outdoor', 'Direct Sow')
              addScheduleEvent(schedule.transplantStart, schedule.transplantEnd, 'transplant', 'Transplant')
            }
          })
        }
      })

      setEvents(newEvents)
    }

    if (!loading && gardens.length > 0) {
      generateEvents()
    }
  }, [gardens, plants, schedules, gardenPlants, selectedGarden, currentDate, loading])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => event.date.startsWith(dateStr))
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-100"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayEvents = getEventsForDate(date)
      const isToday = new Date().toDateString() === date.toDateString()

      days.push(
        <div key={day} className={`h-24 border border-gray-100 p-1 overflow-hidden ${isToday ? 'bg-blue-50' : ''}`}>
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className={`text-xs px-1 py-0.5 rounded border ${EVENT_COLORS[event.type]} truncate`}
                title={event.description}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
            )}
          </div>
        </div>
      )
    }

    return days
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-green-600 animate-pulse" />
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-800">Planting Calendar</h1>
          <p className="text-gray-600 mt-1">Track your planting schedule and garden activities</p>
        </div>
      </div>

      {/* Filters and Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedGarden} onValueChange={setSelectedGarden}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Garden" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gardens</SelectItem>
              {gardens.map((garden) => (
                <SelectItem key={garden.id} value={garden.id}>
                  {garden.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-lg font-semibold min-w-[200px] text-center">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Event Types</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
              <span>Start Seeds Indoor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
              <span>Direct Sow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200"></div>
              <span>Transplant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></div>
              <span>Harvest</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200"></div>
              <span>Planted</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center font-medium text-gray-600 border-r border-gray-100 last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {renderCalendarGrid()}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Upcoming Events (Next 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const now = new Date()
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            const upcomingEvents = events
              .filter(event => {
                const eventDate = new Date(event.date)
                return eventDate >= now && eventDate <= thirtyDaysFromNow
              })
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 10)

            if (upcomingEvents.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <Sprout className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No upcoming events in the next 30 days</p>
                  <p className="text-sm">Add some plants to your gardens to see planting schedules!</p>
                </div>
              )
            }

            return (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={EVENT_COLORS[event.type]}>
                        {event.type.replace('-', ' ')}
                      </Badge>
                      <div>
                        <p className="font-medium text-gray-800">{event.title}</p>
                        {event.garden && (
                          <p className="text-sm text-gray-600">{event.garden}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}