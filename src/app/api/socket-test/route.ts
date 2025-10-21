import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Socket.IO is available',
      socketIoVersion: '4.7.5' // Hardcoded version
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Socket.IO not available',
      error: (error as Error).message 
    }, { status: 500 })
  }
}