import { NextRequest, NextResponse } from 'next/server'

// Simulate an endpoint that can fail
export async function GET(request: NextRequest) {
  try {
    // Check if this is a health check request
    const isHealthCheck = request.headers.get('X-Health-Check') === 'true'
    
    if (isHealthCheck) {
      // For health checks, always return success
      return NextResponse.json({ 
        status: 'healthy', 
        message: 'Test endpoint is running',
        timestamp: new Date().toISOString()
      })
    }
    
    // Simulate random failures for demo purposes
    const shouldFail = Math.random() < 0.1 // 10% chance of failure
    
    if (shouldFail) {
      return NextResponse.json(
        { error: 'Simulated server error' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Test endpoint working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}