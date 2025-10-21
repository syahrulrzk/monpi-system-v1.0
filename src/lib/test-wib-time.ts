/**
 * Test script to verify WIB time integration
 * Run this with: npx tsx src/lib/test-wib-time.ts
 */

import { 
  getCurrentWIBTime, 
  getWIBStartOfDay, 
  getWIBStartOfDaysAgo,
  toWIBTime,
  formatWIBTime,
  formatWIBDate,
  formatWIBDateTime,
  isWithinWIBTimeRange,
  getWIBTimeRangeDescription
} from './time-utils'

console.log('=== WIB Time Integration Test ===\n')

// Test 1: Current WIB Time
console.log('1. Current WIB Time:')
const currentWIB = getCurrentWIBTime()
console.log('   ISO:', currentWIB.iso)
console.log('   Local:', currentWIB.local)
console.log('   Time:', currentWIB.time)
console.log('   Date:', currentWIB.date)
console.log('   Timestamp:', currentWIB.timestamp)
console.log()

// Test 2: Start of Day WIB
console.log('2. Start of Today (WIB):')
const startOfToday = getWIBStartOfDay()
console.log('   Start of Today:', startOfToday.toISOString())
console.log('   Formatted:', formatWIBDateTime(startOfToday))
console.log()

// Test 3: Start of Days Ago
console.log('3. Start of Days Ago (WIB):')
for (const days of [1, 3, 7, 14]) {
  const startDate = getWIBStartOfDaysAgo(days)
  console.log(`   ${days} days ago: ${formatWIBDateTime(startDate)}`)
}
console.log()

// Test 4: Time Range Descriptions
console.log('4. Time Range Descriptions:')
const timeRanges = ['1d', '3d', '7d', '14d'] as const
for (const range of timeRanges) {
  console.log(`   ${range}: ${getWIBTimeRangeDescription(range)}`)
}
console.log()

// Test 5: Time Range Check
console.log('5. Time Range Check:')
const testTimestamps = [
  new Date().toISOString(), // Now
  new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
  new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString() // 16 days ago
]

for (const timestamp of testTimestamps) {
  console.log(`   ${formatWIBDateTime(timestamp)}:`)
  for (const range of timeRanges) {
    const withinRange = isWithinWIBTimeRange(timestamp, range)
    console.log(`     ${range}: ${withinRange ? '✓' : '✗'}`)
  }
}
console.log()

// Test 6: Format Functions
console.log('6. Format Functions:')
const now = new Date().toISOString()
console.log('   Original:', now)
console.log('   WIB Time:', formatWIBTime(now))
console.log('   WIB Date:', formatWIBDate(now))
console.log('   WIB DateTime:', formatWIBDateTime(now))
console.log()

// Test 7: Convert to WIB
console.log('7. Convert to WIB:')
const testDates = [
  new Date(),
  new Date('2024-01-01T12:00:00Z'),
  new Date('2024-06-15T18:30:00Z')
]

for (const date of testDates) {
  const wibTime = toWIBTime(date)
  console.log(`   Original: ${date.toISOString()}`)
  console.log(`   WIB: ${wibTime.local} (${wibTime.time} ${wibTime.date})`)
  console.log()
}

console.log('=== Test Complete ===')