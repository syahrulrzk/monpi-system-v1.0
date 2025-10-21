import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if this is a health check request to avoid infinite loops
    const isHealthCheck = request.headers.get('X-Health-Check') === 'true'
    
    if (isHealthCheck) {
      // Return a simple health check response
      return NextResponse.json({
        status: 'healthy',
        service: 'Payment Service',
        timestamp: new Date().toISOString()
      })
    }
    
    // Simulate Payment Service response - typically slower
    // Add longer delay to simulate payment processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))
    
    const paymentStatus = {
      service: 'Payment Service',
      status: 'operational',
      total_transactions: 15420,
      today_revenue: 45750.00,
      currency: 'USD'
    }

    return NextResponse.json({
      success: true,
      data: paymentStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Payment service error',
        timestamp: new Date().toISOString()
      },
      { status: 502 }
    )
  }
}