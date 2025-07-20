import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, MapPin } from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

interface CreateGardenModalProps {
  onGardenCreated: () => void
}

const GROW_ZONES = [
  { value: '3', label: 'Zone 3 (-40°F to -30°F)' },
  { value: '4', label: 'Zone 4 (-30°F to -20°F)' },
  { value: '5', label: 'Zone 5 (-20°F to -10°F)' },
  { value: '6', label: 'Zone 6 (-10°F to 0°F)' },
  { value: '7', label: 'Zone 7 (0°F to 10°F)' },
  { value: '8', label: 'Zone 8 (10°F to 20°F)' },
  { value: '9', label: 'Zone 9 (20°F to 30°F)' },
  { value: '10', label: 'Zone 10 (30°F to 40°F)' },
  { value: '11', label: 'Zone 11 (40°F to 50°F)' }
]

export function CreateGardenModal({ onGardenCreated }: CreateGardenModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    growZone: '',
    size: '',
    description: ''
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.location || !formData.growZone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const user = await blink.auth.me()
      await blink.db.gardens.create({
        name: formData.name,
        location: formData.location,
        growZone: formData.growZone,
        size: formData.size || null,
        description: formData.description || null,
        userId: user.id,
        createdAt: new Date().toISOString()
      })

      toast({
        title: "Garden Created!",
        description: `${formData.name} has been added to your gardens.`
      })

      setFormData({ name: '', location: '', growZone: '', size: '', description: '' })
      setOpen(false)
      onGardenCreated()
    } catch (error) {
      console.error('Error creating garden:', error)
      toast({
        title: "Error",
        description: "Failed to create garden. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Available",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use a reverse geocoding service to get location name
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
          )
          const data = await response.json()
          const location = `${data.city}, ${data.principalSubdivision}`
          
          setFormData(prev => ({ ...prev, location }))
          
          // Estimate grow zone based on latitude (rough approximation)
          const lat = position.coords.latitude
          let estimatedZone = '6'
          if (lat > 50) estimatedZone = '3'
          else if (lat > 45) estimatedZone = '4'
          else if (lat > 40) estimatedZone = '5'
          else if (lat > 35) estimatedZone = '6'
          else if (lat > 30) estimatedZone = '7'
          else if (lat > 25) estimatedZone = '8'
          else if (lat > 20) estimatedZone = '9'
          else estimatedZone = '10'
          
          setFormData(prev => ({ ...prev, growZone: estimatedZone }))
          
          toast({
            title: "Location Detected",
            description: `Found: ${location} (estimated zone ${estimatedZone})`
          })
        } catch (error) {
          console.error('Error getting location name:', error)
          toast({
            title: "Location Detected",
            description: "Location coordinates obtained, please enter city manually."
          })
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        toast({
          title: "Location Error",
          description: "Unable to get your location. Please enter manually.",
          variant: "destructive"
        })
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Garden
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-green-800">Create New Garden</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Garden Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Backyard Vegetable Garden"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <div className="flex gap-2">
              <Input
                id="location"
                placeholder="e.g., Portland, Oregon"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={detectLocation}
                title="Detect my location"
              >
                <MapPin className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="growZone">Hardiness Zone *</Label>
            <Select value={formData.growZone} onValueChange={(value) => setFormData(prev => ({ ...prev, growZone: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select your grow zone" />
              </SelectTrigger>
              <SelectContent>
                {GROW_ZONES.map((zone) => (
                  <SelectItem key={zone.value} value={zone.value}>
                    {zone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Garden Size</Label>
            <Input
              id="size"
              placeholder="e.g., 10x20 feet, 50 sq ft"
              value={formData.size}
              onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell us about your garden..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? 'Creating...' : 'Create Garden'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}