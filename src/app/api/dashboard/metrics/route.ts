import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for time range
    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '24')

    // Calculate the timestamp for the specified hours ago
    const since = new Date()
    since.setHours(since.getHours() - hours)

    // Get performance metrics
    const metrics = await db.performanceMetric.findMany({
      where: {
        timestamp: {
          gte: since
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      requests,
      responseTime,
      endpointId
    } = body

    const newMetric = await db.performanceMetric.create({
      data: {
        requests: requests || 0,
        responseTime: responseTime || 0,
        endpointId: endpointId || null
      }
    })

    return NextResponse.json(newMetric)
  } catch (error) {
    console.error('Error creating performance metric:', error)
    return NextResponse.json(
      { error: 'Failed to create performance metric' },
      { status: 500 }
    )
  }
}