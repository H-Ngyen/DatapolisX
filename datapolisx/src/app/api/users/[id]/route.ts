import { NextRequest, NextResponse } from 'next/server'
import { userController } from '@/controllers/userController'
import { withErrorHandler } from '@/lib/errorHandler'
import { validateUpdateUser } from '@/lib/validations'

interface RouteParams {
  params: {
    id: string
  }
}

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await userController.getUserById(params.id)
  return NextResponse.json({ success: true, data: user })
})

export const PUT = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const body = await request.json()
  const validatedData = validateUpdateUser(body)
  const user = await userController.updateUser(params.id, validatedData)
  return NextResponse.json({ success: true, data: user })
})

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  await userController.deleteUser(params.id)
  return NextResponse.json({ success: true, message: 'User deleted successfully' })
})
