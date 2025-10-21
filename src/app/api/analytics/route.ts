import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if this is a health check request to avoid infinite loops
    const isHealthCheck = request.headers.get('X-Health-Check') === 'true'
    
    if (isHealthCheck) {
      // Return a simple health check response
      return NextResponse.json({
        status: 'healthy',
        service: 'Analytics Service',
        timestamp: new Date().toISOString()
      })
    }
    
    // Simulate Analytics Service response - typically slower due to data processing
    // Add significant delay to simulate analytics processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 100))
    
    const analyticsData = {
      service: 'Analytics Service',
      status: 'operational',
      page_views_today: 45230,
      unique_visitors: 8450,
      bounce_rate: 32.5,
      avg_session_duration: 245 // seconds
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Analytics service unavailable',
        timestamp: new Date().toISOString()
      },
      { status: 504 }
    )
  }
}