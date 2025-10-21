import { NextRequest, NextResponse } from 'next/server'
import { toWIBTime, getWIBStartOfDaysAgo } from '@/lib/time-utils'
import { requestStorage } from '@/lib/request-storage'

interface EndpointHistoryData {
  timestamp: string
  date: string
  time: string
  uptime: number // percentage (0-100)
  totalRequests: number
  responseTime: number
  errorCount: number
}

// Generate historical data using shared storage
function generateHistoricalData(endpointId: string, days: number): EndpointHistoryData[] {
  const data: EndpointHistoryData[] = []
  const wibNow = toWIBTime(new Date())
  
  // Get actual hourly requests from shared storage
  const endpointData = requestStorage.getEndpointData(endpointId)
  const hourlyRequests = endpointData.hourlyRequests
  
  // Generate data for every hour (more granular for real-time feel)
  const intervalsPerDay = 24 // Every hour
  const totalIntervals = days * intervalsPerDay
  
  for (let i = totalIntervals - 1; i >= 0; i--) {
    const timestamp = new Date(wibNow.timestamp - i * 60 * 60 * 1000)
    const wibTime = toWIBTime(timestamp)
    
    // Get the hour of this data point (0-23)
    const hourOfDay = new Date(wibTime.timestamp).getHours()
    const isBusinessHours = hourOfDay >= 8 && hourOfDay <= 18
    
    // Use actual request data from shared storage for recent hours
    let periodRequests = 0
    if (i < 24) { // Last 24 hours - use actual data
      // For current hour, use the actual accumulated requests
      const currentWIBHour = new Date(wibNow.timestamp).getHours()
      const dataPointHour = new Date(wibTime.timestamp).getHours()
      
      if (dataPointHour === currentWIBHour) {
        // Current hour - use actual accumulated requests
        periodRequests = Math.max(0, hourlyRequests[dataPointHour] || 0)
      } else {
        // Other hours - use distributed requests based on total
        const totalRequests = requestStorage.getRequestCountForTimeRange(endpointId, '1d')
        if (totalRequests > 0) {
          const avgPerHour = totalRequests / 24
          const businessMultiplier = isBusinessHours ? 1.3 : 0.8
          periodRequests = Math.floor(avgPerHour * businessMultiplier * (0.8 + Math.random() * 0.4))
        }
      }
    } else { // Historical data - estimate based on patterns
      const currentRequests = requestStorage.getRequestCountForTimeRange(endpointId, '1d')
      if (currentRequests > 0) {
        const requestRate = currentRequests / 24 // Average per hour
        const businessMultiplier = isBusinessHours ? 1.5 : 0.7
        const timeMultiplier = 0.8 + Math.random() * 0.4 // Random variation
        periodRequests = Math.floor(requestRate * businessMultiplier * timeMultiplier)
      }
    }
    
    // Base values with realistic variations
    let uptime = 99.5 + Math.random() * 0.5 // Base uptime 99.5-100%
    let responseTime = 50 + Math.random() * 100 // 50-150ms
    let errorCount = 0
    
    // Add some realistic variations based on endpoint type
    switch (endpointId) {
      case '1': // User Service
        // Peak during business hours
        if (isBusinessHours) {
          responseTime = 40 + Math.random() * 80
        }
        // Occasional maintenance (99% uptime)
        if (Math.random() < 0.01) {
          uptime = 95 + Math.random() * 4
          errorCount = Math.floor(periodRequests * 0.05)
        }
        break
        
      case '2': // Auth Service
        // More consistent, critical service
        uptime = 99.8 + Math.random() * 0.2
        responseTime = 30 + Math.random() * 50
        break
        
      case '3': // Payment Service
        // Higher latency, more sensitive
        uptime = 99.0 + Math.random() * 1.0
        responseTime = 100 + Math.random() * 150
        // More errors during peak times
        if (hourOfDay >= 14 && hourOfDay <= 16) {
          errorCount = Math.floor(periodRequests * 0.02)
        }
        break
        
      case '4': // Notification Service
        // Batch processing, periodic spikes
        uptime = 99.3 + Math.random() * 0.7
        responseTime = 20 + Math.random() * 180
        break
        
      case '5': // Analytics Service
        // Heavy processing, higher latency
        uptime = 98.5 + Math.random() * 1.5
        responseTime = 200 + Math.random() * 300
        break
        
      case '6': // Test Service (Demo)
        // More volatile for demo purposes
        uptime = 95 + Math.random() * 5
        responseTime = 50 + Math.random() * 200
        // Random failures for demo
        if (Math.random() < 0.1) {
          uptime = 80 + Math.random() * 15
          errorCount = Math.floor(periodRequests * 0.2)
        }
        break
    }
    
    data.push({
      timestamp: wibTime.iso,
      date: wibTime.date,
      time: wibTime.time,
      uptime: Math.round(uptime * 100) / 100,
      totalRequests: periodRequests,
      responseTime: Math.round(responseTime),
      errorCount
    })
  }
  
  return data
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpointId = searchParams.get('endpointId')
    const days = parseInt(searchParams.get('days') || '7')
    
    if (!endpointId) {
      return NextResponse.json(
        { error: 'endpointId is required' },
        { status: 400 }
      )
    }
    
    // Generate historical data using shared storage
    const historicalData = generateHistoricalData(endpointId, days)
    
    // Filter based on requested days using WIB
    const cutoffTime = getWIBStartOfDaysAgo(days)
    const filteredData = historicalData.filter(item => 
      new Date(item.timestamp) >= cutoffTime
    )
    
    // Calculate summary statistics
    const avgUptime = filteredData.reduce((sum, item) => sum + item.uptime, 0) / filteredData.length
    const avgResponseTime = filteredData.reduce((sum, item) => sum + item.responseTime, 0) / filteredData.length
    const totalErrors = filteredData.reduce((sum, item) => sum + item.errorCount, 0)
    
    // Use actual request count from shared storage for consistency with dashboard
    const timeRangeKey = days === 1 ? '1d' : days === 3 ? '3d' : days === 7 ? '7d' : '14d'
    const totalRequests = requestStorage.getRequestCountForTimeRange(endpointId, timeRangeKey)
    
    return NextResponse.json({
      data: filteredData,
      summary: {
        avgUptime: Math.round(avgUptime * 100) / 100,
        totalRequests,
        avgResponseTime: Math.round(avgResponseTime),
        totalErrors,
        errorRate: totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 10000) / 100 : 0
      }
    })
    
  } catch (error) {
    console.error('Failed to fetch endpoint history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch endpoint history' },
      { status: 500 }
    )
  }
}