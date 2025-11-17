"use client"

import { useState } from 'react'
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
  ReferenceLine,
  Legend
} from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Zap } from 'lucide-react'
import { getWIBTimeRangeDescription, formatWIBDateTime } from '@/lib/time-utils'

interface ChartData {
  timestamp: string
  time: string
  date: string
  requests: number
  responseTime: number
}

interface PerformanceChartsProps {
  data: ChartData[]
  timeRange?: TimeRange
}

type TimeRange = '1d' | '3d' | '7d' | '14d'

export function PerformanceCharts({ data, timeRange: propTimeRange }: PerformanceChartsProps) {
  // Use the prop directly instead of maintaining internal state
  const timeRange = propTimeRange || '1d'
  
  // Filter data based on selected time range
  const getFilteredData = () => {
    const now = new Date()
    
    // Function to get start of day (00:00) for date calculations
    const getStartOfDay = (date: Date): Date => {
      const result = new Date(date)
      result.setHours(0, 0, 0, 0)
      return result
    }
    
    let cutoffDate: Date
    
    switch (timeRange) {
      case '1d':
        // Start from today 00:00
        cutoffDate = getStartOfDay(now)
        break
      case '3d':
        // Start from 3 days ago at 00:00
        cutoffDate = new Date(getStartOfDay(now).getTime() - 2 * 24 * 60 * 60 * 1000)
        break
      case '7d':
        // Start from 7 days ago at 00:00
        cutoffDate = new Date(getStartOfDay(now).getTime() - 6 * 24 * 60 * 60 * 1000)
        break
      case '14d':
        // Start from 14 days ago at 00:00
        cutoffDate = new Date(getStartOfDay(now).getTime() - 13 * 24 * 60 * 60 * 1000)
        break
      default:
        // Default to 7 days ago at 00:00
        cutoffDate = new Date(getStartOfDay(now).getTime() - 6 * 24 * 60 * 60 * 1000)
    }
    
    return data.filter(item => {
      const itemTime = new Date(item.timestamp)
      return itemTime >= cutoffDate
    })
  }
  
  const filteredData = getFilteredData()
  
  // Calculate statistics
  const calculateStats = (data: ChartData[], key: 'requests' | 'responseTime') => {
    if (data.length === 0) return { avg: 0, min: 0, max: 0, trend: 'stable' }
    
    const values = data.map(d => d[key])
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)
    
    // Calculate trend (simple comparison between first and last half)
    const halfPoint = Math.floor(data.length / 2)
    const firstHalf = values.slice(0, halfPoint)
    const secondHalf = values.slice(halfPoint)
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    
    let trend = 'stable'
    if (secondAvg > firstAvg * 1.05) trend = 'up'
    else if (secondAvg < firstAvg * 0.95) trend = 'down'
    
    return { avg, min, max, trend }
  }
  
  const requestStats = calculateStats(filteredData, 'requests')
  const responseStats = calculateStats(filteredData, 'responseTime')
  
  // Smart time formatting based on time range and data density
  const getSmartTimeFormat = () => {
    switch (timeRange) {
      case '1d':
        return {
          interval: 6, // Show every 6th tick (every 30 minutes)
          format: (time: string, date: string) => {
            // For 1 day, show only time, remove leading zero from hour (24h format)
            return time.replace(/^0/, '')
          },
          showDate: false
        }
      case '3d':
        return {
          interval: 12, // Show every 12th tick (every hour)
          format: (time: string, date: string) => {
            // For 3 days, show compact date + time (24h format)
            const cleanTime = time.replace(/^0/, '')
            return `${date} ${cleanTime}`
          },
          showDate: true
        }
      case '7d':
        return {
          interval: 48, // Show every 48th tick (every 4 hours)
          format: (time: string, date: string) => {
            // For 7 days, show even more compact format (24h format)
            const cleanTime = time.replace(/^0/, '')
            return `${date} ${cleanTime}`
          },
          showDate: true
        }
      case '14d':
        return {
          interval: 96, // Show every 96th tick (every 8 hours)
          format: (time: string, date: string) => {
            // For 14 days, show only date
            return date
          },
          showDate: true
        }
      default:
        return {
          interval: 6,
          format: (time: string) => time.replace(/^0/, ''),
          showDate: false
        }
    }
  }
  
  const timeFormat = getSmartTimeFormat()
  
  // Format X-axis labels smartly
  const formatXAxisLabel = (value: string, index: number) => {
    if (index % timeFormat.interval !== 0) return ''
    
    const item = filteredData[index]
    if (!item) return value
    
    return timeFormat.format(item.time, item.date)
  }
  
  // Convert 24h time to 12h format for tooltip
  const convertTo12HourFormat = (time24h: string) => {
    const [hours, minutes] = time24h.split(':')
    const hourNum = parseInt(hours, 10)
    const period = hourNum >= 12 ? 'PM' : 'AM'
    const hour12 = hourNum % 12 || 12 // Convert 0 to 12
    return `${hour12}:${minutes} ${period}`
  }
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const displayTime = formatWIBDateTime(data.timestamp)
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg backdrop-blur-sm">
          <p className="font-semibold text-foreground mb-2">
            {displayTime}
          </p>
          {payload.map((entry: any, index: number) => {
            const name = String(entry.name || entry.dataKey || '')
            const value = entry.value
            const isResponseTime = name.toLowerCase().includes('response') || name.toLowerCase().includes('time')
            
            return (
              <div key={index} className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color || entry.stroke }}
                />
                <span className="text-sm font-medium text-foreground">
                  {name}: 
                </span>
                <span className="text-sm text-muted-foreground">
                  {isResponseTime ? `${value}ms` : value.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Requests Over Time Chart */}
        <Card className="border-2 hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Requests Over Time
                </CardTitle>
                <CardDescription className="mt-1">
                  API request volume - {getWIBTimeRangeDescription(timeRange)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {requestStats.trend === 'up' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Up
                  </Badge>
                )}
                {requestStats.trend === 'down' && (
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Down
                  </Badge>
                )}
                {requestStats.trend === 'stable' && (
                  <Badge variant="outline">
                    <Activity className="w-3 h-3 mr-1" />
                    Stable
                  </Badge>
                )}
              </div>
            </div>
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-xs text-muted-foreground">Average</p>
                <p className="text-sm font-bold">{requestStats.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-xs text-muted-foreground">Min</p>
                <p className="text-sm font-bold">{requestStats.min.toLocaleString()}</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-xs text-muted-foreground">Max</p>
                <p className="text-sm font-bold">{requestStats.max.toLocaleString()}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="requestsGradientHover" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
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
                    className="text-muted-foreground"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fill="url(#requestsGradient)"
                    fillOpacity={0.8}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: 'hsl(var(--primary))',
                      stroke: 'hsl(var(--background))',
                      strokeWidth: 2,
                      fillOpacity: 1
                    }}
                  />
                  {/* Average line */}
                  <Line
                    type="monotone"
                    dataKey={() => requestStats.avg}
                    stroke="hsl(var(--muted-foreground))"
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

        {/* Response Time Trend Chart */}
        <Card className="border-2 hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-chart-2" />
                  Response Time Trend
                </CardTitle>
                <CardDescription className="mt-1">
                  Average response time - {getWIBTimeRangeDescription(timeRange)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {responseStats.avg > 200 && (
                  <Badge variant="destructive" className="bg-red-100 text-red-700">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Slow
                  </Badge>
                )}
                {responseStats.avg > 100 && responseStats.avg <= 200 && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Warning
                  </Badge>
                )}
                {responseStats.avg <= 100 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <Activity className="w-3 h-3 mr-1" />
                    Good
                  </Badge>
                )}
              </div>
            </div>
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-xs text-muted-foreground">Average</p>
                <p className={`text-sm font-bold ${
                  responseStats.avg > 200 ? 'text-red-600' : 
                  responseStats.avg > 100 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {responseStats.avg.toFixed(0)}ms
                </p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-xs text-muted-foreground">Min</p>
                <p className="text-sm font-bold text-green-600">{responseStats.min.toFixed(0)}ms</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-xs text-muted-foreground">Max</p>
                <p className={`text-sm font-bold ${
                  responseStats.max > 200 ? 'text-red-600' : 
                  responseStats.max > 100 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {responseStats.max.toFixed(0)}ms
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="responseTimeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
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
                    className="text-muted-foreground"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    domain={['dataMin - 20', 'dataMax + 20']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {/* Warning threshold line at 100ms */}
                  <ReferenceLine 
                    y={100} 
                    stroke="hsl(var(--chart-3))" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    opacity={0.7}
                  />
                  {/* Critical threshold line at 200ms */}
                  <ReferenceLine 
                    y={200} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    opacity={0.7}
                  />
                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={3}
                    fill="url(#responseTimeGradient)"
                    fillOpacity={0.3}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: 'hsl(var(--chart-2))',
                      stroke: 'hsl(var(--background))',
                      strokeWidth: 2
                    }}
                  />
                  {/* Average line */}
                  <Line
                    type="monotone"
                    dataKey={() => responseStats.avg}
                    stroke="hsl(var(--muted-foreground))"
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

        {/* Combined Chart */}
        <Card className="lg:col-span-2 border-2 hover:border-primary/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance Overview
            </CardTitle>
            <CardDescription>
              Combined view of requests and response times ({propTimeRange === '1d' ? 'Today from 00:00' : propTimeRange === '3d' ? 'Last 3 days from 00:00' : propTimeRange === '7d' ? 'Last 7 days from 00:00' : 'Last 14 days from 00:00'})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
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
                    yAxisId="left"
                    orientation="left"
                    className="text-muted-foreground"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    className="text-muted-foreground"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="requests" 
                    name="Requests"
                    fill="url(#barGradient)"
                    fillOpacity={0.8}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="responseTime"
                    name="Response Time (ms)"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={3}
                    dot={{
                      fill: 'hsl(var(--chart-2))',
                      strokeWidth: 2,
                      r: 4,
                      stroke: 'hsl(var(--background))'
                    }}
                    activeDot={{
                      r: 8,
                      fill: 'hsl(var(--chart-2))',
                      stroke: 'hsl(var(--background))',
                      strokeWidth: 3
                    }}
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