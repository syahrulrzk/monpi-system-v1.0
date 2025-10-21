import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if this is a health check request to avoid infinite loops
    const isHealthCheck = request.headers.get('X-Health-Check') === 'true'
    
    if (isHealthCheck) {
      // Return a simple health check response
      return NextResponse.json({
        status: 'healthy',
        service: 'User Service',
        timestamp: new Date().toISOString()
      })
    }
    
    // Simulate User Service response
    // Add small delay to simulate real processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10))
    
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'inactive' }
    ]

    return NextResponse.json({
      success: true,
      data: users,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}