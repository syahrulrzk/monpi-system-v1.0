"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Activity, Zap, AlertTriangle, Clock } from 'lucide-react'
import { getWIBTimeRangeDescription } from '@/lib/time-utils'

interface EndpointHistoryData {
  timestamp: string
  date: string
  time: string
  uptime: number
  totalRequests: number
  responseTime: number
  errorCount: number
}

interface EndpointSummary {
  avgUptime: number
  totalRequests: number
  avgResponseTime: number
  totalErrors: number
  errorRate: number
}

interface EndpointMonitoringProps {
  endpointId: string
  endpointName: string
  timeRange?: string
}

type TimeRange = '1d' | '3d' | '7d' | '14d'

export function EndpointMonitoring({ endpointId, endpointName, timeRange = '1d' }: EndpointMonitoringProps) {
  const [historyData, setHistoryData] = useState<EndpointHistoryData[]>([])
  const [summary, setSummary] = useState<EndpointSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchEndpointHistory = async () => {
    setIsLoading(true)
    try {
      const daysMap = { '1d': 1, '3d': 3, '7d': 7, '14d': 14 }
      const response = await fetch(`/api/endpoint-history?endpointId=${endpointId}&days=${daysMap[timeRange]}`)
      
      if (response.ok) {
        const data = await response.json()
        setHistoryData(data.data)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Failed to fetch endpoint history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEndpointHistory()
  }, [endpointId, timeRange])

  // Smart time formatting based on time range
  const getSmartTimeFormat = () => {
    switch (timeRange) {
      case '1d':
        return {
          interval: 3, // Show every 3rd tick (every 3 hours for better visibility)
          format: (time: string, date: string) => time.replace(/^0/, '')
        }
      case '3d':
        return {
          interval: 12, // Show every 12 hours
          format: (time: string, date: string) => `${date} ${time.replace(/^0/, '')}`
        }
      case '7d':
      case '14d':
        return {
          interval: 24, // Show daily
          format: (time: string, date: string) => date
        }
      default:
        return { interval: 4, format: (time: string) => time.replace(/^0/, '') }
    }
  }

  const timeFormat = getSmartTimeFormat()

  // Format X-axis labels
  const formatXAxisLabel = (value: string, index: number) => {
    if (index % timeFormat.interval !== 0) return ''
    
    const item = historyData[index]
    if (!item) return value
    
    return timeFormat.format(item.time, item.date)
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg backdrop-blur-sm">
          <p className="font-semibold text-foreground mb-2">
            {data.date} {data.time}
          </p>
          {payload.map((entry: any, index: number) => {
            const value = entry.value
            let displayValue = value
            
            const dataKey = typeof entry.dataKey === 'function' ? entry.dataKey.name : entry.dataKey
            
            switch (dataKey) {
              case 'uptime':
                displayValue = `${value.toFixed(2)}%`
                break
              case 'totalRequests':
                displayValue = value.toLocaleString()
                break
              case 'responseTime':
                displayValue = `${value}ms`
                break
              case 'errorCount':
                displayValue = value.toLocaleString()
                break
            }
            
            return (
              <div key={index} className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color || entry.stroke }}
                />
                <span className="text-sm font-medium text-foreground">
                  {entry.name}: 
                </span>
                <span className="text-sm text-muted-foreground">
                  {displayValue}
                </span>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Uptime</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary?.avgUptime && summary.avgUptime > 99 ? 'text-green-600' : summary?.avgUptime && summary.avgUptime > 95 ? 'text-yellow-600' : 'text-red-600'}`}>
              {summary?.avgUptime.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {timeRange === '1d' ? '24 hours' : timeRange === '3d' ? '3 days' : timeRange === '7d' ? '7 days' : '14 days'} average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary?.totalRequests.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All time requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary?.avgResponseTime && summary.avgResponseTime > 200 ? 'text-red-600' : summary?.avgResponseTime && summary.avgResponseTime > 100 ? 'text-yellow-600' : 'text-green-600'}`}>
              {summary?.avgResponseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary?.errorRate && summary.errorRate > 2 ? 'text-red-600' : summary?.errorRate && summary.errorRate > 1 ? 'text-yellow-600' : 'text-green-600'}`}>
              {summary?.errorRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.totalErrors?.toLocaleString()} errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uptime Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Uptime Trend
            </CardTitle>
            <CardDescription>
              Service availability over time - {timeRange === '1d' ? '24 hours (WIB)' : timeRange === '3d' ? '3 days (WIB)' : timeRange === '7d' ? '7 days (WIB)' : '14 days (WIB)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-20" />
                  <XAxis 
                    dataKey="time" 
                    className="text-muted-foreground"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value, index) => formatXAxisLabel(value, index)}
                  />
                  <YAxis 
                    domain={[95, 100]}
                    className="text-muted-foreground"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="uptime"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#uptimeGradient)"
                    fillOpacity={0.8}
                  />
                  {/* 99% uptime target line */}
                  <Line
                    type="monotone"
                    dataKey={() => 99}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                    opacity={0.7}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Total Requests Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Request Volume
            </CardTitle>
            <CardDescription>
              Total API requests over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-20" />
                  <XAxis 
                    dataKey="time" 
                    className="text-muted-foreground"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value, index) => formatXAxisLabel(value, index)}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="totalRequests"
                    fill="#3b82f6"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Response Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              Response Time
            </CardTitle>
            <CardDescription>
              Average response time trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-20" />
                  <XAxis 
                    dataKey="time" 
                    className="text-muted-foreground"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value, index) => formatXAxisLabel(value, index)}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}ms`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: '#a855f7',
                      stroke: 'hsl(var(--background))',
                      strokeWidth: 2
                    }}
                  />
                  {/* Warning threshold line */}
                  <Line
                    type="monotone"
                    dataKey={() => 200}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                    opacity={0.7}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Error Count Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Error Count
            </CardTitle>
            <CardDescription>
              Number of errors over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-20" />
                  <XAxis 
                    dataKey="time" 
                    className="text-muted-foreground"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value, index) => formatXAxisLabel(value, index)}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="errorCount"
                    fill="#ef4444"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}