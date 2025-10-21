// Shared request storage for consistent tracking across APIs using Prisma/Database
import { PrismaClient } from '@prisma/client'

interface RequestData {
  totalRequests: number
  hourlyRequests: number[]
  lastReset: number
  lastCheck?: number
}

interface TimeRangeData {
  '1d': number
  '3d': number
  '7d': number
  '14d': number
}

class RequestStorage {
  private prisma: PrismaClient
  private cache: { [endpointId: string]: { requestData: RequestData; timeRangeData: TimeRangeData } } = {}

  constructor() {
    this.prisma = new PrismaClient()
    
    // Initialize database connection
    this.initializeDatabase()
  }

  // Initialize database and ensure data exists
  private async initializeDatabase(): Promise<void> {
    try {
      await this.prisma.$connect()
      console.log('✅ Connected to database for request storage')
      
      // Ensure all endpoints have data
      await this.ensureEndpointDataExists()
      
      // Load data into cache
      await this.loadDataIntoCache()
      
      console.log('✅ Request storage initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize request storage:', error)
    }
  }

  // Ensure all endpoints have data in database
  private async ensureEndpointDataExists(): Promise<void> {
    const endpointIds = ['1', '2', '3', '4', '5', '6'] // Your endpoint IDs
    
    for (const endpointId of endpointIds) {
      try {
        // Check if request data exists
        const existingRequestData = await this.prisma.requestData.findUnique({
          where: { endpointId }
        })
        
        if (!existingRequestData) {
          // Create request data
          await this.prisma.requestData.create({
            data: {
              endpointId,
              totalRequests: 0,
              hourlyRequests: JSON.stringify(new Array(24).fill(0)),
              lastReset: new Date()
            }
          })
        }
        
        // Check if time range data exists
        const existingTimeRangeData = await this.prisma.timeRangeData.findUnique({
          where: { endpointId }
        })
        
        if (!existingTimeRangeData) {
          // Create time range data
          await this.prisma.timeRangeData.create({
            data: {
              endpointId,
              oneDay: 0,
              threeDays: 0,
              sevenDays: 0,
              fourteenDays: 0
            }
          })
        }
      } catch (error) {
        console.error(`Failed to ensure data exists for endpoint ${endpointId}:`, error)
      }
    }
  }

  // Load data from database into cache
  private async loadDataIntoCache(): Promise<void> {
    try {
      const requestRecords = await this.prisma.requestData.findMany()
      const timeRangeRecords = await this.prisma.timeRangeData.findMany()
      
      // Clear cache
      this.cache = {}
      
      // Load into cache
      for (const record of requestRecords) {
        const hourlyRequests = JSON.parse(record.hourlyRequests as string) as number[]
        
        this.cache[record.endpointId] = {
          requestData: {
            totalRequests: record.totalRequests,
            hourlyRequests: hourlyRequests,
            lastReset: record.lastReset.getTime(),
            lastCheck: record.lastCheck ? record.lastCheck.getTime() : undefined
          },
          timeRangeData: {
            '1d': 0,
            '3d': 0,
            '7d': 0,
            '14d': 0
          }
        }
      }
      
      // Load time range data
      for (const record of timeRangeRecords) {
        if (this.cache[record.endpointId]) {
          this.cache[record.endpointId].timeRangeData = {
            '1d': record.oneDay,
            '3d': record.threeDays,
            '7d': record.sevenDays,
            '14d': record.fourteenDays
          }
        }
      }
      
      console.log('✅ Data loaded into cache successfully')
    } catch (error) {
      console.error('❌ Failed to load data into cache:', error)
    }
  }

  // Save data from cache to database
  private async saveDataToDatabase(endpointId?: string): Promise<void> {
    try {
      if (endpointId) {
        // Save specific endpoint
        await this.saveEndpointData(endpointId)
      } else {
        // Save all endpoints
        for (const id of Object.keys(this.cache)) {
          await this.saveEndpointData(id)
        }
      }
    } catch (error) {
      console.error('❌ Failed to save data to database:', error)
    }
  }

  // Save specific endpoint data
  private async saveEndpointData(endpointId: string): Promise<void> {
    const cachedData = this.cache[endpointId]
    if (!cachedData) return
    
    try {
      // Update request data
      await this.prisma.requestData.update({
        where: { endpointId },
        data: {
          totalRequests: cachedData.requestData.totalRequests,
          hourlyRequests: JSON.stringify(cachedData.requestData.hourlyRequests),
          lastReset: new Date(cachedData.requestData.lastReset),
          lastCheck: cachedData.requestData.lastCheck ? new Date(cachedData.requestData.lastCheck) : null
        }
      })
      
      // Update time range data
      await this.prisma.timeRangeData.update({
        where: { endpointId },
        data: {
          oneDay: cachedData.timeRangeData['1d'],
          threeDays: cachedData.timeRangeData['3d'],
          sevenDays: cachedData.timeRangeData['7d'],
          fourteenDays: cachedData.timeRangeData['14d']
        }
      })
    } catch (error) {
      console.error(`Failed to save endpoint data for ${endpointId}:`, error)
    }
  }

  // Get or initialize endpoint data from cache
  private getEndpointDataInternal(endpointId: string): RequestData {
    if (!this.cache[endpointId]) {
      // Initialize in cache if not exists
      const now = Date.now()
      this.cache[endpointId] = {
        requestData: {
          totalRequests: 0,
          hourlyRequests: new Array(24).fill(0),
          lastReset: now
        },
        timeRangeData: {
          '1d': 0,
          '3d': 0,
          '7d': 0,
          '14d': 0
        }
      }
    }
    
    return this.cache[endpointId].requestData
  }

  // Get time range data from cache
  private getTimeRangeDataInternal(endpointId: string): TimeRangeData {
    if (!this.cache[endpointId]) {
      this.getEndpointDataInternal(endpointId) // Initialize cache
    }
    
    return this.cache[endpointId].timeRangeData
  }

  // Public method to access endpoint data (for endpoint history)
  public getEndpointData(endpointId: string): RequestData {
    return this.getEndpointDataInternal(endpointId)
  }

  // Get realistic request count based on endpoint and time (24 hours only)
  getRealisticRequestCount(endpointId: string, includeHealthCheck: boolean = false): number {
    const now = Date.now()
    const currentHour = new Date().getHours()
    const data = this.getEndpointDataInternal(endpointId)
    
    // Reset hourly data if it's a new day
    if (new Date(data.lastReset).getDate() !== new Date(now).getDate()) {
      data.hourlyRequests = new Array(24).fill(0)
      data.lastReset = now
    }
    
    // Simulate realistic request accumulation based on time since last check
    const timeSinceLastCheck = Math.min(now - (data.lastCheck || now), 300000) // Max 5 minutes
    const minutesSinceLastCheck = timeSinceLastCheck / (1000 * 60)
    
    // Base requests per minute varies by endpoint type
    const baseRequestsPerMinute = this.getBaseRequestRate(endpointId)
    
    // Business hours (8-18) have higher traffic
    const isBusinessHours = currentHour >= 8 && currentHour <= 18
    const businessMultiplier = isBusinessHours ? 1.5 : 0.7
    
    // Add some randomness
    const randomMultiplier = 0.8 + Math.random() * 0.4 // 0.8 to 1.2
    
    // Calculate new requests since last check
    const newRequests = Math.floor(
      baseRequestsPerMinute * 
      minutesSinceLastCheck * 
      businessMultiplier * 
      randomMultiplier
    )
    
    // Add health check as request if specified
    const additionalRequests = includeHealthCheck ? 1 : 0
    
    // Update hourly and total counts
    data.hourlyRequests[currentHour] += newRequests + additionalRequests
    data.totalRequests += newRequests + additionalRequests
    data.lastCheck = now
    
    // Update time range data (only for 1d/24 hours, others are estimates)
    this.updateTimeRangeData(endpointId, newRequests + additionalRequests)
    
    // Save to database asynchronously (don't wait)
    this.saveDataToDatabase(endpointId).catch(error => {
      console.error('Failed to auto-save to database:', error)
    })
    
    // Return 24-hour total (sum of all hourly requests)
    return data.hourlyRequests.reduce((sum, requests) => sum + requests, 0)
  }

  // Update time range data based on new requests
  private updateTimeRangeData(endpointId: string, newRequests: number): number {
    const timeRangeData = this.getTimeRangeDataInternal(endpointId)
    
    // Add new requests to all time ranges
    timeRangeData['1d'] += newRequests
    timeRangeData['3d'] += newRequests
    timeRangeData['7d'] += newRequests
    timeRangeData['14d'] += newRequests
    
    return timeRangeData['1d'] // Return current day total
  }

  // Get request count for specific time range
  getRequestCountForTimeRange(endpointId: string, timeRange: keyof TimeRangeData): number {
    this.getEndpointDataInternal(endpointId) // Ensure data exists
    
    // For 1d, return actual 24-hour total
    if (timeRange === '1d') {
      const data = this.cache[endpointId].requestData
      return data.hourlyRequests.reduce((sum, requests) => sum + requests, 0)
    }
    
    // For other time ranges, use accumulated data
    return this.cache[endpointId].timeRangeData[timeRange]
  }

  // Get base request rate per minute based on endpoint type
  private getBaseRequestRate(endpointId: string): number {
    const endpointRates: { [key: string]: number } = {
      '1': 2.5,  // User Service - medium traffic
      '2': 3.0,  // Auth Service - high traffic (logins, tokens)
      '3': 1.0,  // Payment Service - lower traffic but important
      '4': 4.0,  // Notification Service - high traffic (push notifications)
      '5': 1.5,  // Analytics Service - medium traffic
      '6': 0.5   // Test Service - lowest traffic
    }
    
    return endpointRates[endpointId] || 1.0 // Default rate
  }

  // Calculate total requests across all endpoints for specific time range
  getTotalRequestsForTimeRange(endpointIds: string[], timeRange: keyof TimeRangeData): number {
    return endpointIds.reduce((total, endpointId) => {
      return total + this.getRequestCountForTimeRange(endpointId, timeRange)
    }, 0)
  }

  // Reset request counts (for testing)
  resetRequestCounts(endpointId?: string): void {
    if (endpointId) {
      // Reset specific endpoint
      if (this.cache[endpointId]) {
        const now = Date.now()
        this.cache[endpointId].requestData = {
          totalRequests: 0,
          hourlyRequests: new Array(24).fill(0),
          lastReset: now
        }
        
        // Reset time range data
        this.cache[endpointId].timeRangeData = {
          '1d': 0,
          '3d': 0,
          '7d': 0,
          '14d': 0
        }
        
        // Save to database
        this.saveDataToDatabase(endpointId).catch(error => {
          console.error('Failed to save reset data to database:', error)
        })
      }
    } else {
      // Reset all endpoints
      Object.keys(this.cache).forEach(id => {
        const now = Date.now()
        this.cache[id].requestData = {
          totalRequests: 0,
          hourlyRequests: new Array(24).fill(0),
          lastReset: now
        }
        
        // Reset time range data
        this.cache[id].timeRangeData = {
          '1d': 0,
          '3d': 0,
          '7d': 0,
          '14d': 0
        }
      })
      
      // Save all to database
      this.saveDataToDatabase().catch(error => {
        console.error('Failed to save reset data to database:', error)
      })
    }
  }

  // Get current data for all endpoints (for debugging)
  getAllData(): { [endpointId: string]: { current: RequestData; timeRanges: TimeRangeData } } {
    const result: { [endpointId: string]: { current: RequestData; timeRanges: TimeRangeData } } = {}
    
    Object.keys(this.cache).forEach(endpointId => {
      result[endpointId] = {
        current: this.cache[endpointId].requestData,
        timeRanges: this.cache[endpointId].timeRangeData
      }
    })
    
    return result
  }

  // Manual save method (can be called externally)
  public async saveNow(): Promise<void> {
    await this.saveDataToDatabase()
  }

  // Cleanup method to close database connection
  public async cleanup(): Promise<void> {
    try {
      // Save one final time
      await this.saveDataToDatabase()
      
      // Close database connection
      await this.prisma.$disconnect()
      console.log('✅ Database connection closed')
    } catch (error) {
      console.error('❌ Failed to cleanup request storage:', error)
    }
  }
}

// Export singleton instance
export const requestStorage = new RequestStorage()