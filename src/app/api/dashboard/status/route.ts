import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get the latest system status
    const systemStatus = await db.systemStatus.findFirst({
      orderBy: {
        timestamp: 'desc'
      }
    })

    if (!systemStatus) {
      // Return default status if no data exists
      return NextResponse.json({
        systemHealth: 100.0,
        totalRequests: 0,
        errorRate: 0.0,
        avgResponseTime: 0,
        serverStatus: 'Online',
        serverLatency: 0
      })
    }

    return NextResponse.json({
      systemHealth: systemStatus.systemHealth,
      totalRequests: systemStatus.totalRequests,
      errorRate: systemStatus.errorRate,
      avgResponseTime: systemStatus.avgResponseTime,
      serverStatus: systemStatus.serverStatus,
      serverLatency: systemStatus.serverLatency
    })
  } catch (error) {
    console.error('Error fetching system status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      systemHealth,
      totalRequests,
      errorRate,
      avgResponseTime,
      serverStatus,
      serverLatency
    } = body

    const newStatus = await db.systemStatus.create({
      data: {
        systemHealth: systemHealth || 100.0,
        totalRequests: totalRequests || 0,
        errorRate: errorRate || 0.0,
        avgResponseTime: avgResponseTime || 0,
        serverStatus: serverStatus || 'Online',
        serverLatency: serverLatency || 0
      }
    })

    return NextResponse.json(newStatus)
  } catch (error) {
    console.error('Error creating system status:', error)
    return NextResponse.json(
      { error: 'Failed to create system status' },
      { status: 500 }
    )
  }
}