"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { RefreshCw, Activity, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react'
import { PerformanceCharts } from '@/components/charts/performance-charts'
import { EndpointMonitoring } from '@/components/charts/endpoint-monitoring'
import { TimeRangeSelector } from '@/components/ui/time-range-selector'
import { formatWIBTime, formatWIBDateTime } from '@/lib/time-utils'
import { io, Socket } from 'socket.io-client'
import { useToast } from '@/hooks/use-toast'

interface SystemLog {
  id: string
  timestamp: string
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  message: string
  endpoint?: string
  details?: any
}

interface ApiEndpoint {
  id: string
  name: string
  url: string
  status: 'healthy' | 'warning' | 'error'
  lastCheck: string
  responseTime: number
  requestCount: number
}

interface SystemStatus {
  health: number
  totalRequests: number
  requestsFromLastHour: number
  errorRate: number
  avgResponseTime: number
  serverStatus: 'online' | 'offline'
  serverLatency: number
}

interface ChartData {
  timestamp: string
  time: string
  date: string
  requests: number
  responseTime: number
}

export default function Dashboard() {
  const { toast } = useToast()
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('endpoints')
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [timeRange, setTimeRange] = useState<'1d' | '3d' | '7d' | '14d'>('1d') // Default to 1 day (24 hours)
  const socketRef = useRef<Socket | null>(null)

  const fetchEndpointsData = async () => {
    try {
      const endpointsRes = await fetch('/api/endpoints')
      if (endpointsRes.ok) {
        const endpointsData = await endpointsRes.json()
        setEndpoints(endpointsData)
      }
    } catch (error) {
      console.error('Failed to fetch endpoints data:', error)
    }
  }

  const fetchSystemStatus = async () => {
    try {
      const statusRes = await fetch(`/api/system?timeRange=${timeRange}`)
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setSystemStatus(statusData)
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error)
    }
  }

  const fetchChartData = async () => {
    try {
      const chartsRes = await fetch(`/api/charts?timeRange=${timeRange}`)
      if (chartsRes.ok) {
        const chartsData = await chartsRes.json()
        setChartData(chartsData)
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
    }
  }

  const fetchLogsData = async () => {
    try {
      const logsRes = await fetch(`/api/logs?limit=20&timeRange=${timeRange}`)
      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setSystemLogs(logsData)
      }
    } catch (error) {
      console.error('Failed to fetch logs data:', error)
    }
  }

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchEndpointsData(),
        fetchSystemStatus(),
        fetchChartData(),
        fetchLogsData()
      ])
      setLastRefresh(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint)
    setActiveTab('monitoring') // Switch to Endpoint Monitoring tab
    
    // Show success toast
    toast({
      title: `Viewing ${endpoint.name}`,
      description: "Switched to Endpoint Monitoring tab",
    })
    
    // Scroll to monitoring section after a short delay to ensure tab has switched
    setTimeout(() => {
      const monitoringSection = document.getElementById('monitoring-section')
      if (monitoringSection) {
        monitoringSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const smartRefresh = async () => {
    if (isRefreshing) return // Prevent multiple refreshes
    
    setIsRefreshing(true)
    try {
      // Always update system status (critical for topbar)
      await fetchSystemStatus()
      
      // Update data based on active tab
      switch (activeTab) {
        case 'endpoints':
          await fetchEndpointsData()
          break
        case 'charts':
          await fetchChartData()
          break
        case 'monitoring':
          // Endpoint monitoring data is fetched by the component itself
          break
        case 'logs':
          await fetchLogsData()
          break
      }
      
      setLastRefresh(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Smart refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleTimeRangeChange = async (newRange: '1d' | '3d' | '7d' | '14d') => {
    setTimeRange(newRange)
    // Refresh all data when time range changes
    await fetchDashboardData()
  }

  useEffect(() => {
    // Set initial last refresh time
    setLastRefresh(new Date().toLocaleTimeString())
    
    // Request notification permission
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    fetchDashboardData()
    
    // Setup WebSocket connection for real-time updates
    try {
      // Use the current host instead of localhost to allow connections from other devices
      const host = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      socketRef.current = io(host, {
        path: '/api/socketio',
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true
      })

      const socket = socketRef.current

      socket.on('connect', () => {
        console.log('WebSocket connected', socket.id)
        setIsConnected(true)
      })

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error.message)
        setIsConnected(false)
      })

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason)
        setIsConnected(false)
      })

      // Test connection
      socket.on('message', (data) => {
        console.log('Received message:', data)
      })

      // Listen for API status changes
      socket.on('api-status-changed', (data) => {
        console.log('API status changed:', data)
        
        // Add to logs
        const newLog: SystemLog = {
          id: Date.now().toString(),
          timestamp: data.timestamp,
          level: data.newStatus === 'error' ? 'CRITICAL' : data.newStatus === 'warning' ? 'WARNING' : 'INFO',
          message: data.message,
          endpoint: data.endpointName,
          details: {
            oldStatus: data.oldStatus,
            newStatus: data.newStatus,
            responseTime: data.responseTime
          }
        }
        
        setSystemLogs(prev => [newLog, ...prev.slice(0, 19)]) // Keep last 20 logs
        
        // Show browser notification
        if (data.newStatus === 'error' && Notification.permission === 'granted') {
          new Notification('🚨 API Down!', {
            body: `${data.endpointName} is down`,
            icon: '/favicon.ico'
          })
        }
      })

      // Manual test after connection
      socket.on('connect', () => {
        console.log('Testing connection...')
        socket.emit('message', { text: 'Test connection', senderId: 'dashboard' })
      })

    } catch (error) {
      console.error('Failed to setup WebSocket:', error)
      setIsConnected(false)
    }

    // Smart auto-refresh every 30 seconds - only update relevant data
    const interval = setInterval(smartRefresh, 30000)
    
    return () => {
      clearInterval(interval)
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Healthy</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" /> Warning</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatResponseTime = (time: number) => {
    if (time > 200) {
      return <span className="text-red-600 font-medium">{time} ms (Needs attention)</span>
    } else if (time > 100) {
      return <span className="text-yellow-600 font-medium">{time} ms</span>
    }
    return <span className="text-green-600 font-medium">{time} ms</span>
  }

  const getLogBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <Badge variant="destructive" className="bg-red-600">🚨 CRITICAL</Badge>
      case 'ERROR':
        return <Badge variant="destructive">❌ ERROR</Badge>
      case 'WARNING':
        return <Badge variant="secondary" className="bg-yellow-500 text-yellow-900">⚠️ WARNING</Badge>
      case 'INFO':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">ℹ️ INFO</Badge>
      default:
        return <Badge variant="outline">{level}</Badge>
    }
  }

  const formatLogTime = (timestamp: string) => {
    return formatWIBTime(timestamp)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Topbar */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">MONPI SYSTEM</h1>
                <p className="text-xs text-muted-foreground">API Monitoring Dashboard</p>
              </div>
            </div>
            {systemStatus && (
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${systemStatus.serverStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`font-medium ${systemStatus.serverStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                    Server {systemStatus.serverStatus === 'online' ? 'Online' : 'Offline'}
                  </span>
                  <span className={`text-muted-foreground ${systemStatus.serverLatency > 100 ? 'text-red-500' : systemStatus.serverLatency > 50 ? 'text-yellow-500' : 'text-green-500'}`}>
                    ({systemStatus.serverLatency}ms)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-muted-foreground">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content with padding for fixed topbar */}
      <div className="flex-1 pt-20 pb-20"> {/* pt-20 for topbar, pb-20 for bottombar */}
        <div className="container mx-auto px-4 py-6">
          {/* Dashboard Title */}
          <div className="mb-8 bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">API Monitoring Dashboard</h2>
                <p className="text-muted-foreground mt-2">Real-time monitoring of API endpoints with performance analytics and system health tracking</p>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Auto refresh every 30 seconds</span>
                  </div>
                  <span className="text-muted-foreground hidden sm:block">•</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Showing requests from last 24 hours</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <TimeRangeSelector 
                  selectedRange={timeRange} 
                  onRangeChange={handleTimeRangeChange} 
                />
              </div>
            </div>
          </div>

          {/* Status Cards */}
          {systemStatus && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus.health.toFixed(1)}%</div>
                  <Progress value={systemStatus.health} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">Auto-updated every 30s</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus.totalRequests.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +{systemStatus.requestsFromLastHour.toLocaleString()} from last hour
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${systemStatus.errorRate > 2 ? 'text-red-600' : 'text-green-600'}`}>
                    {systemStatus.errorRate.toFixed(1)}%
                  </div>
                  <Progress value={systemStatus.errorRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatResponseTime(systemStatus.avgResponseTime)}
                  </div>
                  <p className="text-xs text-muted-foreground">Last updated: {lastRefresh}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="endpoints" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 gap-2 bg-card p-1 rounded-lg shadow-sm">
              <TabsTrigger value="endpoints" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                API Endpoints
              </TabsTrigger>
              <TabsTrigger value="charts" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Performance Charts
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                Endpoint Monitoring
                {selectedEndpoint && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedEndpoint.name}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="logs" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                System Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="endpoints" className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle>API Endpoints Status</CardTitle>
                      <CardDescription>Monitor the status and performance of your endpoints</CardDescription>
                    </div>
                    <Button onClick={smartRefresh} variant="outline" size="sm" disabled={isRefreshing} className="shadow-sm">
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="font-semibold">Endpoint Name</TableHead>
                          <TableHead className="font-semibold">URL</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Last Check</TableHead>
                          <TableHead className="font-semibold">Response Time</TableHead>
                          <TableHead className="font-semibold">Requests</TableHead>
                          <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {endpoints.map((endpoint) => (
                          <TableRow key={endpoint.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{endpoint.name}</TableCell>
                            <TableCell className="font-mono text-sm">{endpoint.url}</TableCell>
                            <TableCell>{getStatusBadge(endpoint.status)}</TableCell>
                            <TableCell className="text-muted-foreground">{endpoint.lastCheck}</TableCell>
                            <TableCell>{formatResponseTime(endpoint.responseTime)}</TableCell>
                            <TableCell>{endpoint.requestCount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewDetails(endpoint)}
                                className="shadow-sm"
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts" className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Performance Charts</CardTitle>
                  <CardDescription>Visual analytics of API performance and request patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <PerformanceCharts data={chartData} timeRange={timeRange} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-6" id="monitoring-section">
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle>Endpoint Monitoring</CardTitle>
                      <CardDescription>
                        {selectedEndpoint 
                          ? `Detailed monitoring for ${selectedEndpoint.name}`
                          : 'Select an endpoint from the API Endpoints tab to view detailed monitoring'
                        }
                      </CardDescription>
                    </div>
                    {selectedEndpoint && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedEndpoint(null)}
                          className="shadow-sm"
                        >
                          Clear Selection
                        </Button>
                        <Button onClick={smartRefresh} variant="outline" size="sm" disabled={isRefreshing} className="shadow-sm">
                          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                          {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedEndpoint ? (
                    <EndpointMonitoring 
                      endpointId={selectedEndpoint.id}
                      endpointName={selectedEndpoint.name}
                      timeRange={timeRange}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Endpoint Selected</h3>
                      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        Go to the API Endpoints tab and click "View Details" on any endpoint to see detailed monitoring data.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('endpoints')}
                        className="shadow-sm"
                      >
                        View Endpoints
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle>System Logs</CardTitle>
                      <CardDescription>Real-time system events and API status changes</CardDescription>
                    </div>
                    <Button onClick={smartRefresh} variant="outline" size="sm" disabled={isRefreshing} className="shadow-sm">
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Refreshing Logs...' : 'Refresh Logs'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto rounded-md border p-2 bg-muted/10">
                    {systemLogs.length > 0 ? (
                      systemLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors bg-background">
                          <div className="flex-shrink-0 pt-0.5">
                            {getLogBadge(log.level)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{log.message}</span>
                              {log.endpoint && (
                                <Badge variant="outline" className="text-xs">
                                  {log.endpoint}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatLogTime(log.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No logs available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-medium">MONPI SYSTEM</span>
              <span className="text-xs">| API Monitoring Dashboard</span>
            </div>
            <div className="flex items-center justify-center text-muted-foreground gap-1">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastRefresh}</span>
            </div>
            <div className="flex items-center justify-end text-muted-foreground">
              <span className="text-xs">© 2025 MONPI SYSTEM. All rights reserved.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}