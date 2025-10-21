import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get all API endpoints
    const endpoints = await db.apiEndpoint.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(endpoints)
  } catch (error) {
    console.error('Error fetching API endpoints:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API endpoints' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      name,
      url,
      status,
      responseTime,
      requestCount
    } = body

    const newEndpoint = await db.apiEndpoint.create({
      data: {
        name: name || '',
        url: url || '',
        status: status || 'healthy',
        responseTime: responseTime || 0,
        requestCount: requestCount || 0
      }
    })

    return NextResponse.json(newEndpoint)
  } catch (error) {
    console.error('Error creating API endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to create API endpoint' },
      { status: 500 }
    )
  }
}