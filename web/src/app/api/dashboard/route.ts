import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errorHandler'
import { dashboardController } from '@/controllers/dashboardController'

export const GET = withErrorHandler(async () => {
  const users = await dashboardController.getDashboardData()
  return NextResponse.json({ success: true, data: users })
})
