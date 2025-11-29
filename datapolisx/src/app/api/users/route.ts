import { NextRequest, NextResponse } from 'next/server'
import { userController } from '@/controllers/userController'
import { withErrorHandler } from '@/lib/errorHandler'
import { validateCreateUser } from '@/lib/validations'

export const GET = withErrorHandler(async () => {
  const users = await userController.getUsers()
  return NextResponse.json({ success: true, data: users })
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = validateCreateUser(body)
  const user = await userController.createUser(validatedData)
  return NextResponse.json({ success: true, data: user }, { status: 201 })
})
