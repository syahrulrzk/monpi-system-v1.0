import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWIBTime } from '@/lib/time-utils'
import { requestStorage } from '@/lib/request-storage'

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error'
  responseTime: number
  requestCount: number
}

// Function to get realistic request count based on endpoint and time
function getRealisticRequestCount(endpointId: string, includeHealthCheck: boolean = false): number {
  return requestStorage.getRealisticRequestCount(endpointId, includeHealthCheck)
}

// Function to perform actual health check on an endpoint
async function performHealthCheck(endpointUrl: string, endpointId: string): Promise<HealthCheckResult> {
  const startTime = Date.now()
  
  try {
    // Try to make actual API call to the endpoint
    const baseUrl = 'http://localhost:3000'
    const fullUrl = baseUrl + endpointUrl
    
    // Add a special header to identify health check requests and prevent infinite loops
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Health-Check': 'true' // Special header to identify health checks
      },
      // Set timeout to 5 seconds
      signal: AbortSignal.timeout(5000)
    })

    const responseTime = Date.now() - startTime

    if (response.ok) {
      // If response is successful (2xx), consider it healthy
      // But check response time for warning status
      if (responseTime > 200) {
        return {
          status: 'warning',
          responseTime,
          requestCount: getRealisticRequestCount(endpointId, true) // Include health check as request
        }
      } else {
        return {
          status: 'healthy',
          responseTime,
          requestCount: getRealisticRequestCount(endpointId, true) // Include health check as request
        }
      }
    } else if (response.status >= 400 && response.status < 500) {
      // Client errors (4xx) - warning
      return {
        status: 'warning',
        responseTime,
        requestCount: getRealisticRequestCount(endpointId, true) // Include health check as request
      }
    } else {
      // Server errors (5xx) - error
      return {
        status: 'error',
        responseTime,
        requestCount: getRealisticRequestCount(endpointId, true) // Include health check as request
      }
    }
  } catch (error) {
    // Network errors, timeouts, etc.
    const responseTime = Date.now() - startTime
    return {
      status: 'error',
      responseTime,
      requestCount: getRealisticRequestCount(endpointId, true) // Include health check as request
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { endpointId, endpointName, endpointUrl, currentStatus } = await request.json()
    
    if (!endpointId || !endpointName || !endpointUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: endpointId, endpointName, endpointUrl' },
        { status: 400 }
      )
    }

    // Perform health check
    const healthResult = await performHealthCheck(endpointUrl, endpointId)
    
    // Return the result with WIB time
    const wibTime = getCurrentWIBTime()
    return NextResponse.json({
      id: endpointId,
      name: endpointName,
      url: endpointUrl,
      status: healthResult.status,
      lastCheck: wibTime.time,
      responseTime: healthResult.responseTime,
      requestCount: healthResult.requestCount
    })
    
  } catch (error) {
    console.error('Manual health check failed:', error)
    return NextResponse.json(
      { error: 'Failed to perform health check' },
      { status: 500 }
    )
  }
}