/**
 * Time utilities for WIB (Asia/Jakarta) timezone
 */

export interface WIBTime {
  iso: string
  local: string
  time: string
  date: string
  dateFull: string // Added for full date format
  timestamp: number
}

/**
 * Get current time in WIB (Asia/Jakarta)
 */
export function getCurrentWIBTime(): WIBTime {
  const now = new Date()
  
  // Format to WIB timezone
  const wibTime = new Date(now.toLocaleString("en-US", { 
    timeZone: "Asia/Jakarta" 
  }))
  
  const iso = wibTime.toISOString()
  const timestamp = wibTime.getTime()
  
  // Format time in 24-hour format (HH:MM)
  const time = wibTime.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
  
  // Format date in Indonesian format (DD/MM)
  const date = wibTime.toLocaleDateString('en-US', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit'
  })
  
  // Format full date in Indonesian format (DD/MM/YYYY)
  const dateFull = wibTime.toLocaleDateString('en-US', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  
  // Format local datetime string
  const local = wibTime.toLocaleString('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  return {
    iso,
    local,
    time,
    date,
    dateFull,
    timestamp
  }
}

/**
 * Convert any date to WIB timezone
 */
export function toWIBTime(date: Date | string): WIBTime {
  const inputDate = typeof date === 'string' ? new Date(date) : date
  
  const wibTime = new Date(inputDate.toLocaleString("en-US", { 
    timeZone: "Asia/Jakarta" 
  }))
  
  const iso = wibTime.toISOString()
  const timestamp = wibTime.getTime()
  
  const time = wibTime.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
  
  const dateStr = wibTime.toLocaleDateString('en-US', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit'
  })
  
  const dateFull = wibTime.toLocaleDateString('en-US', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  
  const local = wibTime.toLocaleString('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  return {
    iso,
    local,
    time,
    date: dateStr,
    dateFull,
    timestamp
  }
}

/**
 * Get start of day in WIB (00:00:00 WIB)
 */
export function getWIBStartOfDay(date?: Date): Date {
  const targetDate = date || new Date()
  
  // Create date in WIB timezone
  const wibDate = new Date(targetDate.toLocaleString("en-US", { 
    timeZone: "Asia/Jakarta" 
  }))
  
  // Set to start of day in WIB
  wibDate.setHours(0, 0, 0, 0)
  
  return wibDate
}

/**
 * Get start of day X days ago in WIB
 */
export function getWIBStartOfDaysAgo(daysAgo: number): Date {
  const now = new Date()
  const wibNow = new Date(now.toLocaleString("en-US", { 
    timeZone: "Asia/Jakarta" 
  }))
  
  // Subtract days
  const targetDate = new Date(wibNow.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  
  // Set to start of day in WIB
  return getWIBStartOfDay(targetDate)
}

/**
 * Format timestamp to WIB time string for display
 */
export function formatWIBTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  
  return date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Format timestamp to WIB date string for display (Indonesian format DD/MM/YYYY)
 */
export function formatWIBDate(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  
  return date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Format timestamp to WIB datetime string for display (Indonesian format DD/MM/YYYY HH:MM:SS)
 */
export function formatWIBDateTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

/**
 * Check if a timestamp is within time range in WIB
 */
export function isWithinWIBTimeRange(
  timestamp: string | Date, 
  startTimeRange: '1d' | '3d' | '7d' | '14d'
): boolean {
  const targetDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const wibTargetDate = new Date(targetDate.toLocaleString("en-US", { 
    timeZone: "Asia/Jakarta" 
  }))
  
  let cutoffDate: Date
  
  switch (startTimeRange) {
    case '1d':
      cutoffDate = getWIBStartOfDay() // Today 00:00 WIB
      break
    case '3d':
      cutoffDate = getWIBStartOfDaysAgo(2) // 3 days ago 00:00 WIB
      break
    case '7d':
      cutoffDate = getWIBStartOfDaysAgo(6) // 7 days ago 00:00 WIB
      break
    case '14d':
      cutoffDate = getWIBStartOfDaysAgo(13) // 14 days ago 00:00 WIB
      break
    default:
      cutoffDate = getWIBStartOfDaysAgo(6) // Default to 7 days
  }
  
  return wibTargetDate >= cutoffDate
}

/**
 * Get WIB time range description
 */
export function getWIBTimeRangeDescription(timeRange: '1d' | '3d' | '7d' | '14d'): string {
  switch (timeRange) {
    case '1d':
      return 'Today (from 00:00 WIB)'
    case '3d':
      return 'Last 3 days (from 00:00 WIB)'
    case '7d':
      return 'Last 7 days (from 00:00 WIB)'
    case '14d':
      return 'Last 14 days (from 00:00 WIB)'
    default:
      return 'Last 7 days (from 00:00 WIB)'
  }
}