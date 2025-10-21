import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get system logs with pagination
    const logs = await db.systemLog.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching system logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      level,
      message,
      source
    } = body

    const newLog = await db.systemLog.create({
      data: {
        level: level || 'INFO',
        message: message || '',
        source: source || ''
      }
    })

    return NextResponse.json(newLog)
  } catch (error) {
    console.error('Error creating system log:', error)
    return NextResponse.json(
      { error: 'Failed to create system log' },
      { status: 500 }
    )
  }
}