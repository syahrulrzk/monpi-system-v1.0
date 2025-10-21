import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if this is a health check request to avoid infinite loops
    const isHealthCheck = request.headers.get('X-Server-Health-Check') === 'true'
    
    if (isHealthCheck) {
      // Return a simple health check response for server latency measurement
      return NextResponse.json({
        status: 'healthy',
        service: 'Server Health',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      })
    }
    
    // Regular health check with more detailed info
    const serverInfo = {
      status: 'healthy',
      service: 'Main Server',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node_version: process.version,
      environment: process.env.NODE_ENV
    }

    return NextResponse.json({
      success: true,
      data: serverInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}