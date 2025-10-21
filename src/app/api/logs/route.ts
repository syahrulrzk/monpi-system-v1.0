import { NextRequest, NextResponse } from 'next/server'
import { 
  getWIBStartOfDay, 
  getWIBStartOfDaysAgo,
  getCurrentWIBTime 
} from '@/lib/time-utils'

interface SystemLog {
  id: string
  timestamp: string
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  message: string
  endpoint?: string
  details?: any
}

// In-memory storage for logs (in production, use database)
let systemLogs: SystemLog[] = [
  {
    id: '1',
    timestamp: getCurrentWIBTime().iso,
    level: 'INFO',
    message: 'System monitoring initialized',
    details: { service: 'monitoring', version: '1.0.0' }
  },
  {
    id: '2',
    timestamp: new Date(getCurrentWIBTime().timestamp - 60000).toISOString(),
    level: 'INFO',
    message: 'All endpoints health check completed',
    details: { endpointsChecked: 5, healthy: 5 }
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const limit = parseInt(searchParams.get('limit') || '50')
    const timeRange = searchParams.get('timeRange') || '1d' // Default to 1 day
    
    let filteredLogs = systemLogs
    
    // Filter by time range using WIB
    if (timeRange && timeRange !== 'all') {
      let cutoffDate: Date
      
      switch (timeRange) {
        case '1d':
          // Start from today 00:00 WIB
          cutoffDate = getWIBStartOfDay()
          break
        case '3d':
          // Start from 3 days ago at 00:00 WIB
          cutoffDate = getWIBStartOfDaysAgo(2)
          break
        case '7d':
          // Start from 7 days ago at 00:00 WIB
          cutoffDate = getWIBStartOfDaysAgo(6)
          break
        case '14d':
          // Start from 14 days ago at 00:00 WIB
          cutoffDate = getWIBStartOfDaysAgo(13)
          break
        default:
          // Default to 7 days ago at 00:00 WIB
          cutoffDate = getWIBStartOfDaysAgo(6)
      }
      
      filteredLogs = systemLogs.filter(log => new Date(log.timestamp) >= cutoffDate)
    }
    
    // Filter by level if specified
    if (level && level !== 'ALL') {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }
    
    // Sort by timestamp (newest first) and limit
    const sortedLogs = filteredLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
    
    return NextResponse.json(sortedLogs)
  } catch (error) {
    console.error('Failed to fetch logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newLog: SystemLog = {
      id: Date.now().toString(),
      timestamp: getCurrentWIBTime().iso,
      level: body.level || 'INFO',
      message: body.message,
      endpoint: body.endpoint,
      details: body.details
    }
    
    // Add to logs array
    systemLogs.unshift(newLog)
    
    // Keep only last 14 days of logs to prevent memory issues
    // Calculate cutoff date (14 days ago in WIB)
    const cutoffDate = getWIBStartOfDaysAgo(14)
    systemLogs = systemLogs.filter(log => new Date(log.timestamp) >= cutoffDate)
    
    // Also limit total number of logs to prevent memory issues
    if (systemLogs.length > 10000) {
      systemLogs = systemLogs.slice(0, 10000)
    }
    
    console.log(`[${newLog.level}] ${newLog.message}`, newLog.details)
    
    return NextResponse.json(newLog, { status: 201 })
  } catch (error) {
    console.error('Failed to create log:', error)
    return NextResponse.json(
      { error: 'Failed to create log' },
      { status: 500 }
    )
  }
}