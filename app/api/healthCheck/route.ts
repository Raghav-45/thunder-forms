import { NextResponse } from 'next/server'

export async function GET() {
  // Simulating some basic checks
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  }

  return NextResponse.json(checks, { status: 200 })
}
