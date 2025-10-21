'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Settings, Activity, Cpu, HardDrive } from 'lucide-react'

interface Service {
  id: string
  name: string
  url: string
  status: 'running' | 'stopped' | 'error'
  lastCheck: string
  cpuUsage: number
  memoryUsage: number
  uptime: string
}

interface EditServiceModalProps {
  service: Service
  onUpdate: (updatedService: Service) => void
  children: React.ReactNode
}

export function EditServiceModal({ service, onUpdate, children }: EditServiceModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRealtime, setIsRealtime] = useState(false)
  const [realtimeData, setRealtimeData] = useState<Service>(service)
  const [editData, setEditData] = useState<Service>(service)
  const [isSaving, setIsSaving] = useState(false)

  // Real-time data simulation
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isOpen && isRealtime) {
      interval = setInterval(async () => {
        try {
          const response = await fetch('/api/services/update')
          const data = await response.json()
          const serviceData = data.find((s: any) => s.id === service.id)
          if (serviceData) {
            setRealtimeData(prev => ({
              ...prev,
              cpuUsage: parseFloat(serviceData.cpuUsage.toFixed(1)),
              memoryUsage: parseFloat(serviceData.memoryUsage.toFixed(1)),
              status: serviceData.status,
              lastCheck: new Date().toLocaleTimeString()
            }))
          }
        } catch (error) {
          console.error('Failed to fetch real-time data:', error)
        }
      }, 2000) // Update every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isOpen, isRealtime, service.id])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/services/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: editData.id,
          cpuUsage: editData.cpuUsage,
          memoryUsage: editData.memoryUsage,
          status: editData.status
        }),
      })

      if (response.ok) {
        onUpdate(editData)
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Failed to update service:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getServiceBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-green-500">Running</Badge>
      case 'stopped':
        return <Badge variant="secondary" className="bg-gray-500">Stopped</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const displayData = isRealtime ? realtimeData : editData

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Edit Service: {service.name}
          </DialogTitle>
          <DialogDescription>
            Monitor and manage service metrics in real-time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Real-time Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Real-time Monitoring</Label>
              <p className="text-xs text-muted-foreground">
                Enable to see live CPU and memory usage
              </p>
            </div>
            <Button
              variant={isRealtime ? "default" : "outline"}
              size="sm"
              onClick={() => setIsRealtime(!isRealtime)}
            >
              {isRealtime ? "Stop Real-time" : "Start Real-time"}
            </Button>
          </div>

          {/* Current Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  {getServiceBadge(displayData.status)}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Last Check</Label>
                  <p className="text-sm text-muted-foreground">{displayData.lastCheck}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  <Label className="text-sm font-medium">CPU Usage</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={displayData.cpuUsage} className="flex-1" />
                  <span className="text-sm font-medium w-12 text-right">{displayData.cpuUsage.toFixed(1)}%</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  <Label className="text-sm font-medium">Memory Usage</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={displayData.memoryUsage} className="flex-1" />
                  <span className="text-sm font-medium w-12 text-right">{displayData.memoryUsage.toFixed(1)}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Uptime</Label>
                <p className="text-sm text-muted-foreground">{displayData.uptime}</p>
              </div>
            </CardContent>
          </Card>

          {/* Manual Edit (only when not in real-time mode) */}
          {!isRealtime && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Manual Configuration</CardTitle>
                <CardDescription>
                  Manually adjust service metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editData.status}
                      onValueChange={(value: 'running' | 'stopped' | 'error') => 
                        setEditData(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="stopped">Stopped</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uptime">Uptime</Label>
                    <Input
                      id="uptime"
                      value={editData.uptime}
                      onChange={(e) => setEditData(prev => ({ ...prev, uptime: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpu">CPU Usage (%)</Label>
                    <Input
                      id="cpu"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editData.cpuUsage}
                      onChange={(e) => setEditData(prev => ({ 
                        ...prev, 
                        cpuUsage: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memory">Memory Usage (%)</Label>
                    <Input
                      id="memory"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editData.memoryUsage}
                      onChange={(e) => setEditData(prev => ({ 
                        ...prev, 
                        memoryUsage: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          {!isRealtime && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}