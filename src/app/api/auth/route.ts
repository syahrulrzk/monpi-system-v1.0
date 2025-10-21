import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if this is a health check request to avoid infinite loops
    const isHealthCheck = request.headers.get('X-Health-Check') === 'true'
    
    if (isHealthCheck) {
      // Return a simple health check response
      return NextResponse.json({
        status: 'healthy',
        service: 'Auth Service',
        timestamp: new Date().toISOString()
      })
    }
    
    // Simulate Auth Service response
    // Add small delay to simulate real processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 5))
    
    const authStatus = {
      service: 'Authentication Service',
      status: 'operational',
      active_sessions: 127,
      last_login: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: authStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Authentication service unavailable',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}