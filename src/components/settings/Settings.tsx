import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, MapPin, Bell, Shield, Download, Trash2, Save } from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

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

interface UserProfile {
  id: string
  email: string
  displayName?: string
  location?: string
  defaultGrowZone?: string
  bio?: string
  notifications?: {
    email: boolean
    planting: boolean
    harvest: boolean
    weather: boolean
  }
}

export function Settings() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    location: '',
    defaultGrowZone: '',
    bio: '',
    notifications: {
      email: true,
      planting: true,
      harvest: true,
      weather: false
    }
  })
  const { toast } = useToast()

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await blink.auth.me()
        setUser(userData)
        
        // Try to load user profile from database
        try {
          const profiles = await blink.db.userProfiles.list({
            where: { userId: userData.id },
            limit: 1
          })
          
          if (profiles.length > 0) {
            const userProfile = profiles[0]
            setProfile(userProfile)
            setFormData({
              displayName: userProfile.displayName || userData.displayName || '',
              location: userProfile.location || '',
              defaultGrowZone: userProfile.defaultGrowZone || '',
              bio: userProfile.bio || '',
              notifications: userProfile.notifications || {
                email: true,
                planting: true,
                harvest: true,
                weather: false
              }
            })
          } else {
            // Initialize with user data
            setFormData(prev => ({
              ...prev,
              displayName: userData.displayName || ''
            }))
          }
        } catch (error) {
          console.error('Error loading profile:', error)
          // Profile table might not exist, that's okay
          setFormData(prev => ({
            ...prev,
            displayName: userData.displayName || ''
          }))
        }
      } catch (error) {
        console.error('Error loading user:', error)
        toast({
          title: "Error",
          description: "Failed to load user data.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [toast])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Update user display name if changed
      if (formData.displayName !== user.displayName) {
        await blink.auth.updateMe({
          displayName: formData.displayName
        })
      }

      // Save or update profile
      const profileData = {
        userId: user.id,
        displayName: formData.displayName,
        location: formData.location,
        defaultGrowZone: formData.defaultGrowZone,
        bio: formData.bio,
        notifications: formData.notifications,
        updatedAt: new Date().toISOString()
      }

      if (profile) {
        await blink.db.userProfiles.update(profile.id, profileData)
      } else {
        await blink.db.userProfiles.create({
          id: `profile_${user.id}`,
          ...profileData,
          createdAt: new Date().toISOString()
        })
      }

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully."
      })

      // Reload user data
      const updatedUser = await blink.auth.me()
      setUser(updatedUser)

    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    try {
      const userData = await blink.auth.me()
      
      // Gather all user data
      const [gardens, gardenPlants] = await Promise.all([
        blink.db.gardens.list({ where: { userId: userData.id } }),
        blink.db.gardenPlants.list({ where: { userId: userData.id } })
      ])

      const exportData = {
        user: userData,
        profile: profile,
        gardens: gardens,
        gardenPlants: gardenPlants,
        exportDate: new Date().toISOString()
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `garden-tracker-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Data Exported",
        description: "Your garden data has been downloaded successfully."
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      // In a real app, you'd call an API to delete the account
      // For now, just log out
      await blink.auth.logout()
      
      toast({
        title: "Account Deletion",
        description: "Account deletion requested. Please contact support to complete the process.",
        variant: "destructive"
      })
    } catch (error) {
      console.error('Error deleting account:', error)
      toast({
        title: "Error",
        description: "Failed to process account deletion request.",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="w-8 h-8 mx-auto mb-2 text-green-600 animate-pulse" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-green-800">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-green-100 text-green-700 text-lg">
                {formData.displayName ? formData.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-gray-600">Profile Picture</p>
              <p className="text-xs text-gray-500">Avatar is managed by your account provider</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Your display name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself and your gardening experience..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            Location & Growing Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Default Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Portland, Oregon"
              />
              <p className="text-xs text-gray-500">Used as default for new gardens</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultGrowZone">Default Hardiness Zone</Label>
              <Select 
                value={formData.defaultGrowZone} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, defaultGrowZone: value }))}
              >
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
              <p className="text-xs text-gray-500">Used as default for new gardens</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-green-600" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
              <Switch
                checked={formData.notifications.email}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    notifications: { ...prev.notifications, email: checked }
                  }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Planting Reminders</p>
                <p className="text-sm text-gray-600">Get notified about optimal planting times</p>
              </div>
              <Switch
                checked={formData.notifications.planting}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    notifications: { ...prev.notifications, planting: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Harvest Reminders</p>
                <p className="text-sm text-gray-600">Get notified when plants are ready to harvest</p>
              </div>
              <Switch
                checked={formData.notifications.harvest}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    notifications: { ...prev.notifications, harvest: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weather Alerts</p>
                <p className="text-sm text-gray-600">Get notified about weather conditions affecting your garden</p>
              </div>
              <Switch
                checked={formData.notifications.weather}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    notifications: { ...prev.notifications, weather: checked }
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Data & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export Your Data</p>
              <p className="text-sm text-gray-600">Download a copy of all your garden data</p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}