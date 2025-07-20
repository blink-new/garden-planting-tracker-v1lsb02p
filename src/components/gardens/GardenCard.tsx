import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Ruler, Calendar, Plus, Settings } from 'lucide-react'
import { format } from 'date-fns'

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

interface GardenCardProps {
  garden: Garden
  onAddPlant: (gardenId: string) => void
  onManage: (gardenId: string) => void
}

export function GardenCard({ garden, onAddPlant, onManage }: GardenCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-green-100">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-green-800 mb-1">
              {garden.name}
            </CardTitle>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              {garden.location}
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Zone {garden.growZone}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {garden.size && (
            <div className="flex items-center text-gray-600">
              <Ruler className="w-4 h-4 mr-2" />
              <span>{garden.size}</span>
            </div>
          )}
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Created {format(new Date(garden.createdAt), 'MMM yyyy')}</span>
          </div>
        </div>

        {garden.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {garden.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-green-700">{garden.plantCount || 0}</span> plants
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddPlant(garden.id)}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Plant
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onManage(garden.id)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}