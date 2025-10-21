import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if this is a health check request to avoid infinite loops
    const isHealthCheck = request.headers.get('X-Health-Check') === 'true'
    
    if (isHealthCheck) {
      // Return a simple health check response
      return NextResponse.json({
        status: 'healthy',
        service: 'Notification Service',
        timestamp: new Date().toISOString()
      })
    }
    
    // Simulate Notification Service response - typically fast
    // Add minimal delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 5))
    
    const notificationStatus = {
      service: 'Notification Service',
      status: 'operational',
      pending_notifications: 45,
      sent_today: 1230,
      delivery_rate: 98.5
    }

    return NextResponse.json({
      success: true,
      data: notificationStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Notification service failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}