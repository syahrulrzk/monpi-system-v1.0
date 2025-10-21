import { NextRequest, NextResponse } from 'next/server'
import { requestStorage } from '@/lib/request-storage'

interface ApiEndpoint {
  id: string
  name: string
  url: string
  status: 'healthy' | 'warning' | 'error'
  lastCheck: string
  responseTime: number
  requestCount: number
}

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error'
  responseTime: number
  requestCount: number
}

// In-memory storage for previous status to detect changes
let previousStatuses: Record<string, 'healthy' | 'warning' | 'error'> = {}

// Function to log status changes
async function logStatusChange(endpointId: string, endpointName: string, oldStatus: string, newStatus: string, responseTime: number) {
  try {
    if (oldStatus !== newStatus) {
      let level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO'
      let message = ''
      
      if (newStatus === 'error') {
        level = 'CRITICAL'
        message = `🚨 ${endpointName} is DOWN! Status changed from ${oldStatus} to ${newStatus}`
      } else if (newStatus === 'warning') {
        level = 'WARNING'
        message = `⚠️ ${endpointName} performance degraded. Status: ${newStatus}`
      } else if (oldStatus === 'error' && newStatus === 'healthy') {
        level = 'INFO'
        message = `✅ ${endpointName} is RECOVERED! Status back to healthy`
      } else {
        level = 'INFO'
        message = `${endpointName} status changed from ${oldStatus} to ${newStatus}`
      }
      
      // Send to logs API
  await fetch(`http://localhost:3000/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          message,
          endpoint: endpointName,
          details: {
            endpointId,
            oldStatus,
            newStatus,
            responseTime,
            timestamp: new Date().toISOString()
          }
        })
      })
      
      console.log(`Status Change Logged: ${message}`)
    }
  } catch (error) {
    console.error('Failed to log status change:', error)
  }
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

export async function GET() {
  try {
    // Define endpoints to monitor
    const endpointsToCheck = [
      {
        id: '1',
        name: 'User Service',
        url: '/api/users'
      },
      {
        id: '2',
        name: 'Auth Service',
        url: '/api/auth'
      },
      {
        id: '3',
        name: 'Payment Service',
        url: '/api/payments'
      },
      {
        id: '4',
        name: 'Notification Service',
        url: '/api/notifications'
      },
      {
        id: '5',
        name: 'Analytics Service',
        url: '/api/analytics'
      },
      {
        id: '6',
        name: 'Test Service (Demo)',
        url: '/api/test-endpoint'
      }
    ]

    // Perform actual health checks for all endpoints
    const healthCheckPromises = endpointsToCheck.map(async (endpoint) => {
      const healthResult = await performHealthCheck(endpoint.url, endpoint.id)
      
      // Check for status changes and log them
      const oldStatus = previousStatuses[endpoint.id] || 'unknown'
      if (oldStatus !== healthResult.status) {
        await logStatusChange(endpoint.id, endpoint.name, oldStatus, healthResult.status, healthResult.responseTime)
      }
      
      // Update previous status
      previousStatuses[endpoint.id] = healthResult.status
      
      return {
        id: endpoint.id,
        name: endpoint.name,
        url: endpoint.url,
        status: healthResult.status,
        lastCheck: new Date().toLocaleTimeString(),
        responseTime: healthResult.responseTime,
        requestCount: healthResult.requestCount
      }
    })

    // Wait for all health checks to complete
    const endpoints = await Promise.all(healthCheckPromises)

    return NextResponse.json(endpoints)
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { error: 'Failed to perform health checks' },
      { status: 500 }
    )
  }
}