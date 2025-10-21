import { NextRequest, NextResponse } from 'next/server'
import { requestStorage } from '@/lib/request-storage'

export async function GET(request: NextRequest) {
  try {
    // Get current data
    const allData = requestStorage.getAllData()
    
    return NextResponse.json({
      success: true,
      message: 'Storage test endpoint',
      data: allData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Storage test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get storage data'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    switch (action) {
      case 'save':
        await requestStorage.saveNow()
        return NextResponse.json({
          success: true,
          message: 'Data saved to database'
        })
        
      case 'reset':
        requestStorage.resetRequestCounts()
        return NextResponse.json({
          success: true,
          message: 'All request counts reset'
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Storage action error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to perform storage action'
    }, { status: 500 })
  }
}