import { NextRequest, NextResponse } from 'next/server'
import { requestStorage } from '@/lib/request-storage'
import endpointsConfig from '../../../../config/endpoints.json'

// Type assertion for JSON import
const typedEndpointsConfig = endpointsConfig as ConfigEndpoint[]

interface AuthConfig {
  required: boolean
  type?: 'bearer' | 'api-key' | 'basic' | 'oauth2'
  token?: string
  key?: string
  header?: string
  username?: string
  password?: string
}

interface ConfigEndpoint {
  id: string
  name: string
  url: string
  auth?: AuthConfig
}

interface ApiEndpoint {
  id: string
  name: string
  url: string
  auth?: AuthConfig
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
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000'
      await fetch(`${baseUrl}/api/logs`, {
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

// Function to resolve environment variables in auth configuration
function resolveEnvironmentVariables(auth: AuthConfig): AuthConfig {
  const resolvedAuth = { ...auth };
  
  // Resolve token if it contains environment variable reference
  if (auth.token && auth.token.startsWith('${') && auth.token.endsWith('}')) {
    const envVarName = auth.token.slice(2, -1);
    resolvedAuth.token = process.env[envVarName] || auth.token;
  }
  
  // Resolve key if it contains environment variable reference
  if (auth.key && auth.key.startsWith('${') && auth.key.endsWith('}')) {
    const envVarName = auth.key.slice(2, -1);
    resolvedAuth.key = process.env[envVarName] || auth.key;
  }
  
  // Resolve username if it contains environment variable reference
  if (auth.username && auth.username.startsWith('${') && auth.username.endsWith('}')) {
    const envVarName = auth.username.slice(2, -1);
    resolvedAuth.username = process.env[envVarName] || auth.username;
  }
  
  // Resolve password if it contains environment variable reference
  if (auth.password && auth.password.startsWith('${') && auth.password.endsWith('}')) {
    const envVarName = auth.password.slice(2, -1);
    resolvedAuth.password = process.env[envVarName] || auth.password;
  }
  
  return resolvedAuth;
}

// Function to get realistic request count based on endpoint and time
function getRealisticRequestCount(endpointId: string, includeHealthCheck: boolean = false): number {
  return requestStorage.getRealisticRequestCount(endpointId, includeHealthCheck)
}

// Function to perform actual health check on an endpoint
async function performHealthCheck(endpoint: ConfigEndpoint): Promise<HealthCheckResult> {
  const startTime = Date.now()
  
  try {
    // Try to make actual API call to the endpoint
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000'
    const fullUrl = baseUrl + endpoint.url
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Health-Check': 'true' // Special header to identify health checks
    }
    
    // Add authentication if required
    if (endpoint.auth?.required) {
      // Resolve environment variables in auth values
      const resolvedAuth = resolveEnvironmentVariables(endpoint.auth);
      
      // Add appropriate authentication header based on type
      if (resolvedAuth.type === 'bearer' || resolvedAuth.type === 'oauth2') {
        if (resolvedAuth.token) {
          headers['Authorization'] = `Bearer ${resolvedAuth.token}`;
        }
      } else if (resolvedAuth.type === 'api-key') {
        const headerName = resolvedAuth.header || 'x-api-key';
        if (resolvedAuth.key) {
          headers[headerName] = resolvedAuth.key;
        }
      } else if (resolvedAuth.type === 'basic') {
        if (resolvedAuth.username && resolvedAuth.password) {
          const credentials = Buffer.from(`${resolvedAuth.username}:${resolvedAuth.password}`).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
      } else {
        // Default to bearer token if type is not specified
        if (resolvedAuth.token) {
          headers['Authorization'] = `Bearer ${resolvedAuth.token}`;
        }
      }
    }
    
    // Add a special header to identify health check requests and prevent infinite loops
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
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
          requestCount: getRealisticRequestCount(endpoint.id, true) // Include health check as request
        }
      } else {
        return {
          status: 'healthy',
          responseTime,
          requestCount: getRealisticRequestCount(endpoint.id, true) // Include health check as request
        }
      }
    } else if (response.status >= 400 && response.status < 500) {
      // Client errors (4xx) - warning
      return {
        status: 'warning',
        responseTime,
        requestCount: getRealisticRequestCount(endpoint.id, true) // Include health check as request
      }
    } else {
      // Server errors (5xx) - error
      return {
        status: 'error',
        responseTime,
        requestCount: getRealisticRequestCount(endpoint.id, true) // Include health check as request
      }
    }
  } catch (error) {
    // Network errors, timeouts, etc.
    const responseTime = Date.now() - startTime
    return {
      status: 'error',
      responseTime,
      requestCount: getRealisticRequestCount(endpoint.id, true) // Include health check as request
    }
  }
}

export async function GET() {
  try {
    // Define endpoints to monitor - loaded from external JSON file
    const endpointsToCheck = typedEndpointsConfig

    // Perform actual health checks for all endpoints
    const healthCheckPromises = endpointsToCheck.map(async (endpoint) => {
      const healthResult = await performHealthCheck(endpoint)
      
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